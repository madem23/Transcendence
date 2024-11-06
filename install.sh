#
#     [ Moabi Platform installation scripts ]
#
# 02_docker_install.sh
# This script install the necessary docker components
#
# Author: Jonathan Brossard
# Version: 1.0
# Last update: 21 April 2021
#

myid=`id -u`
if [ "$myid" != "0" ]
then
    echo " !! Please run this script as root"
    exit
fi

apt-get update && sudo apt-get upgrade -y
apt install net-tools

## Docker

apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
    
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
   
apt-get update

apt-get install -y docker-ce docker-ce-cli containerd.io

usermod -aG docker $USER

## Docker compose

curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
chmod 755 /usr/bin/docker-compose

echo " ** [1/1] Docker installed on server"