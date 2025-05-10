#!/bin/bash
set -e

echo "Initializing configuration files..."

# Create nginx config from template
echo "Generating nginx.conf..."
NGROK_DOMAIN=${NGROK_DOMAIN:-""}
if [ -n "$NGROK_DOMAIN" ]; then
  echo "Using NGROK domain: $NGROK_DOMAIN"
else
  echo "No NGROK domain provided, using localhost only"
fi

# Generate the nginx.conf file
envsubst '${NGROK_DOMAIN}' < /cw-config/cw-ui-nginx-template/nginx.conf.template > /usr/share/nginx/html/nginx.conf

# Create env-config.js from template
echo "Generating env-config.js..."
GRAPHQL_URI=${GRAPHQL_URI:-"http://localhost:4000/graphql"}

# If NGROK_DOMAIN is set, use it for the GRAPHQL_URI
if [ -n "$NGROK_DOMAIN" ]; then
  GRAPHQL_URI="https://${NGROK_DOMAIN}/graphql"
  echo "Setting GRAPHQL_URI to: $GRAPHQL_URI"
fi

# Generate the env-config.js file
envsubst '${GRAPHQL_URI}' < /cw-config/cw-ui-template/env-config.js.template > /usr/share/nginx/html/config/env-config.js

echo "Configuration files generated successfully."