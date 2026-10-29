"""Smoke the actual deploy images; no database, external network or retained state."""
import argparse
import json
import subprocess

SCRIPT = r'''
import fs from 'node:fs';
import assert from 'node:assert/strict';
assert(!fs.existsSync('.env'));
assert(!fs.existsSync('src'));
if (process.env.IMAGE_KIND === 'backend') {
  assert(!fs.existsSync('node_modules/prisma'), 'Migration CLI leaked into backend');
  assert(!fs.existsSync('node_modules/typescript'), 'Compiler leaked into backend');
  await import('@nestjs/core');
  await import('./dist/prisma/prisma.service.js');
  await import('@aws-sdk/client-s3');
  const sharp = (await import('sharp')).default;
  const bytes = await sharp({create:{width:1,height:1,channels:3,background:'white'}}).png().toBuffer();
  assert(bytes.length > 0);
} else {
  assert(!fs.existsSync('dist'));
  assert(!fs.existsSync('node_modules/@nestjs/core'));
  await import('mariadb');
  assert(fs.existsSync('node_modules/prisma/build/index.js'));
  assert(fs.existsSync('prisma/migrations'));
}
console.log(JSON.stringify({kind:process.env.IMAGE_KIND,result:'PASS'}));
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', required=True)
    parser.add_argument('--schema', required=True)
    args = parser.parse_args()
    for kind, image in [('backend', args.backend), ('schema', args.schema)]:
        subprocess.run(['docker', 'run', '--rm', '--platform', 'linux/amd64', '--network', 'none',
                        '--read-only', '--tmpfs', '/tmp:rw,size=16m', '-e', 'IMAGE_KIND=' + kind,
                        image, 'node', '--input-type=module', '-e', SCRIPT], check=True)
        if kind == 'schema':
            subprocess.run(['docker', 'run', '--rm', '--platform', 'linux/amd64', '--network', 'none',
                            image, 'node', 'node_modules/prisma/build/index.js', '-v'], check=True)
    print(json.dumps({'result': 'PASS', 'checks': 'backend native sharp/runtime imports; schema CLI isolation; no env/source'}))


if __name__ == '__main__':
    main()
