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
tmux ls
tmux kill-session -t <session_name>
#gserve
npm install -g serve
serve -s dist -l 5173
#
pip install sqlalchemy
pip install cryptography
pip install alembic
pip install bleach
pip install boto3
pip install aioboto3
#Ensure that the Nginx user (usually www-data) has the necessary permissions
# to read from the /srv/Merime/images/
sudo chown -R www-data:www-data /srv/Merime/images
sudo chmod -R 755 /srv/Merime/images

pip install celery redis
sudo apt install redis-server
#Always start the Redis server before the worker
sudo service redis-server start
celery -A celery_server worker --loglevel=info
pip install Flask-OAuthlib requests google-auth

901607ece20b460484ba1b7b330db019