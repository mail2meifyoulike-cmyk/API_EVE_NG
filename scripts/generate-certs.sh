#!/bin/bash
# Generate SSL/TLS certificates using Let's Encrypt

set -e

DOMAIN=${1:-localhost}
CERT_DIR="./certs"

echo "Generating SSL/TLS certificates for domain: $DOMAIN"

# Create cert directory
mkdir -p $CERT_DIR

# For development/testing with self-signed certificate
if [ "$DOMAIN" = "localhost" ]; then
    echo "Generating self-signed certificate for localhost..."
    openssl req -x509 -newkey rsa:4096 -nodes -out $CERT_DIR/server.crt -keyout $CERT_DIR/server.key -days 365 -subj "/CN=localhost"
    echo "Self-signed certificate created at $CERT_DIR/"
else
    echo "For production, use Let's Encrypt:"
    echo "  1. Install certbot: sudo apt-get install certbot"
    echo "  2. Run: sudo certbot certonly --standalone -d $DOMAIN"
    echo "  3. Copy certificates: cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/server.crt"
    echo "  4. Copy key: cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/server.key"
fi
