#!/bin/bash
# Test SSH connection to remote server
sshpass -p "Jmeng0814@" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 jack@box.exoad.net "echo 'SSH connection successful'; whoami; pwd"