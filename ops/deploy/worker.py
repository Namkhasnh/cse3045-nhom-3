#!/usr/bin/python3
"""Service-only entrypoint; never exposed in sudoers."""
import sys
sys.path.insert(0, '/usr/local/lib/hlf-deploy')
from controller import worker
from release import commit_id, require

if __name__ == '__main__':
    require(len(sys.argv) == 3 and sys.argv[1] in ['deploy', 'rollback'], 'Invalid service operation')
    worker(sys.argv[1], commit_id(sys.argv[2]))
