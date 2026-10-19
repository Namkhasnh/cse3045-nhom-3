"""Private synthetic CLI driver. Never emit terminal contents or enrollment secrets."""
import base64
import hashlib
import hmac
import json
import os
import pty
import re
import select
import signal
import struct
import sys
import time
import urllib.parse


def run(config):
    pid, fd = pty.fork()
    if pid == 0:
        os.execvpe(config["command"][0], config["command"], os.environ)
    transcript = ""
    sent = set()
    deadline = time.monotonic() + 90
    status = None
    try:
        while time.monotonic() < deadline:
            if select.select([fd], [], [], 0.1)[0]:
                try:
                    chunk = os.read(fd, 65536)
                except OSError:
                    chunk = b""
                transcript += chunk.decode("utf-8", errors="replace")
            for prompt, answer in [
                ("Password: ", config["password"]),
                ("Confirm password: ", config["password"] if config["mode"] != "password-mismatch" else "different"),
                ("Authenticator code: ", None),
                ("Type SAVED after securing the codes: ", "SAVED" if config["mode"] != "custody-denied" else "NO"),
            ]:
                if prompt not in transcript or prompt in sent:
                    continue
                if answer is None:
                    uri = re.search(r"otpauth://[^\r\n]+", transcript)
                    if not uri:
                        raise RuntimeError("Missing enrollment URI")
                    secret = urllib.parse.parse_qs(urllib.parse.urlparse(uri.group()).query)["secret"][0]
                    key = base64.b32decode(secret + "=" * ((-len(secret)) % 8))
                    counter = int(time.time() // 30)
                    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
                    offset = digest[-1] & 15
                    code = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000
                    if config["mode"] == "totp-invalid":
                        # Deliberately non-numeric: cannot accidentally match the +/-1 window.
                        answer = "invalid"
                    else:
                        answer = str(code).zfill(6)
                os.write(fd, (answer + "\r").encode())
                sent.add(prompt)
            child, current = os.waitpid(pid, os.WNOHANG)
            if child:
                status = current
                break
        if status is None:
            raise RuntimeError("CLI timed out")
        success = "Sole Admin " in transcript and " enrolled; previous sessions revoked." in transcript
        codes = re.findall(r"(?m)^([a-f0-9]{32})\r?$", transcript)
        return {"exit": os.waitstatus_to_exitcode(status), "success": success,
                "password_confirmation": "Confirm password: " in sent,
                "authenticator_prompt": "Authenticator code: " in sent,
                "custody_prompt": "Type SAVED after securing the codes: " in sent,
                "recovery_count": len(codes),
                "recovery_hashes": [hashlib.sha256(c.encode()).hexdigest() for c in codes]}
    finally:
        if status is None:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        os.close(fd)


try:
    print(json.dumps(run(json.load(sys.stdin))))
except Exception:
    # Terminal may contain passwords, otpauth URI and recovery material.
    print(json.dumps({"driver_error": True}))
    sys.exit(1)
