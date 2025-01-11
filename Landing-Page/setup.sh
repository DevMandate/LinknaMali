#npm
sudo apt install -y build-essential
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
#Verify certificate
ls /etc/letsencrypt/live/yourdomain.com
#Generate the Diffie-Hellman parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
sudo ln -s /etc/nginx/sites-available/linknamali /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
#tmux
sudo apt update
sudo apt install tmux
tmux new-session -s react-app
tmux attach-session -t react-app
#gserve
npm install -g serve
serve -s dist -l 5173
