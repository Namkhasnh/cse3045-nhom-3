// Minimal local STARTTLS mailbox for exercising the real Nodemailer transport.
import net from 'node:net';
import tls from 'node:tls';
import { readFile } from 'node:fs/promises';

export async function mailbox(keyPath, certPath) {
  const messages = [], sockets = new Set();
  const context = tls.createSecureContext({ key: await readFile(keyPath), cert: await readFile(certPath) });
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    function handle(stream, secure) {
      let buffer = '', data = false, authenticated = false;
      const receive = chunk => {
        buffer += chunk.toString();
        while (buffer.includes('\r\n')) {
          const end = buffer.indexOf('\r\n'), line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (data) {
            if (line === '.') { messages.push(data); data = false; stream.write('250 stored\r\n'); }
            else data += line + '\r\n';
          } else if (/^EHLO /i.test(line)) {
            stream.write(secure ? '250-localhost\r\n250 AUTH PLAIN\r\n' : '250-localhost\r\n250 STARTTLS\r\n');
          } else if (line === 'STARTTLS' && !secure) {
            stream.removeListener('data', receive);
            stream.write('220 begin TLS\r\n');
            const encrypted = new tls.TLSSocket(stream, { isServer: true, secureContext: context });
            encrypted.on('error', () => {});
            handle(encrypted, true);
            return;
          } else if (secure && line.startsWith('AUTH PLAIN ')) {
            authenticated = Buffer.from(line.slice(11), 'base64').toString() === '\0sandbox\0synthetic';
            stream.write(authenticated ? '235 authenticated\r\n' : '535 rejected\r\n');
          } else if (authenticated && /^(MAIL FROM:|RCPT TO:)/i.test(line)) stream.write('250 OK\r\n');
          else if (authenticated && line === 'DATA') { data = '\r\n'; stream.write('354 send message\r\n'); }
          else if (line === 'QUIT') stream.end('221 bye\r\n');
          else stream.write('500 unexpected command\r\n');
        }
      };
      stream.on('data', receive);
    }
    socket.write('220 localhost synthetic mailbox\r\n');
    handle(socket, false);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, messages,
    close: () => new Promise(resolve => { for (const socket of sockets) socket.destroy(); server.close(resolve); }) };
}
