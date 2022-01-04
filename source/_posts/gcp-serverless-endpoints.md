---
title: Google Cloud Functions on a custom domain
tags: 
  - Serverless
categories:
  - Web Development
date: 2020-11-18
---

If you're building a web API with Google's Cloud Functions then you've probably noticed that it gives you a pretty long URL to access your functions from.

Probably more annoyingly though, is that this endpoint won't respond properly to `OPTIONS` requests, meaning if you try to use it from a browser you probably won't get far.

If you want to put it on your own domain, and respond to CORS requests, you'll need to do a bit of wrangling. We're going to define all our cloud functions as an API on [Cloud Endpoints](https://cloud.google.com/endpoints/docs/openapi/about-cloud-endpoints), then deploy a proxy on Cloud Run that will route all our requests for us.

# Reserving our hostname

We're going to deploy a placeholder "Hello, World" container to Cloud Run so that we know what hostname our API will be using. You need to do this even if you have a custom domain.

Firstly, set up your configuration with `gcloud init`. Then, run

```
$ gcloud run deploy hello-world \
    --image="gcr.io/cloudrun/hello" \
    --allow-unauthenticated \
    --platform managed
```

Replace `hello-world` with whatever name you want your service to have. It can be descriptive, or not. If you haven't used cloud run before, it'll ask you to enable it:

```
API [run.googleapis.com] not enabled on project [505791114032]. Would 
you like to enable and retry (this will take a few minutes)? (y/N)?  y

Enabling service [run.googleapis.com] on project [505791114032]...
Operation "operations/acf.bdd6378e-96f7-4089-95d5-765f7bc4153d" finished successfully.
```

Then we choose our region:

```
Please specify a region:
 [1] asia-east1
 [2] asia-east2

[...]

Please enter your numeric choice:  12
```

Then give it a minute to upload our (useless) service. Finally, you'll get something like:

```
Done.                                                                                                                                                                        
Service [hello-world] revision [hello-world-00001-ten] has been deployed and is serving 100 percent of traffic.
Service URL: https://hello-world-XXXXXXXXX-nw.a.run.app
```

Take a note of this URL, we'll need it later.

# Defining your API

We're going to use OpenAPI to define our API. This is a super useful format that can also be used to generate documentation, mock an API, and a bunch of other stuff. We'll start off pretty basic though, so in `openapi.yaml`

```yaml
swagger: '2.0'
info:
  title: Hello World
  description: Says hello
  version: 1.0.0
host: SERVICE_URL
schemes:
  - https
produces:
  - application/json
```

Replace `SERVICE_URL` with whatever hostname you got before, but without `https://`. Now let's add in a route for our proxy to map:

```yaml
paths:
  /hello:
    get:
      summary: Says hello
      operationId: hello
      x-google-backend:
        address: https://europe-west1-hello-world.cloudfunctions.net/hello
        protocol: h2
      responses:
        '200':
          description: A successful response
          schema:
            type: string
```

A lot of this is just documentation that OpenAPI expects, the only special part is `x-google-backend`, which tells our proxy exactly what to do. Remember to replace `address` with whatever URL your cloud function uses.

Now we can deploy this config:

```
$ gcloud endpoints services deploy openapi.yaml
[...]

Service Configuration [2020-11-18r0] uploaded for service [hello-world-296019.appspot.com]
```

Now Google knows what our API looks like and where we're eventually going to put it. Take a note of the config id - `2020-11-18r0` here, it'll be important later.

# Deploying our proxy service

We're going to build up a docker image (using google's build servers), then deploy it. So first up, here's our Dockerfile:

```dockerfile
FROM gcr.io/endpoints-release/endpoints-runtime-serverless:2.20.0

USER root
ENV ENDPOINTS_SERVICE_PATH /etc/endpoints/service.json
COPY service.json ${ENDPOINTS_SERVICE_PATH}
RUN chown -R envoy:envoy ${ENDPOINTS_SERVICE_PATH} && chmod -R 755 ${ENDPOINTS_SERVICE_PATH}
USER envoy

ENTRYPOINT ["/env_start_proxy.py"]
```

You'll probably notice the references to `service.json`. This is something Google generated when we uploaded our openapi functions. Unfortunately though, there's no way to get it easily with the SDK, so we hack it a little bit and use cURL:

```
$ curl -o "service.json" -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://servicemanagement.googleapis.com/v1/services/SERVICE_NAME/configs/CONFIG_ID?view=FULL"
```

So, for my deployment above this would be:

```
$ curl -o "service.json" -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://servicemanagement.googleapis.com/v1/services/hello-world-k4csboiwma-nw.a.run.app/configs/2020-11-18r0?view=FULL"
```

Now we can just ask google to build our image:

```
$ gcloud builds submit --tag "gcr.io/PROJECT/endpoints-runtime-serverless:SERVICE_NAME-CONFIG_ID" .
```

For example:

```
$ gcloud builds submit --tag "gcr.io/hello-world-296019/endpoints-runtime-serverless:hello-world-k4csboiwma-nw.a.run.app-2020-11-18r0" .
```

We could technically make the tag anything we like, as long as it's in our namespace (starts with `gcr.io/PROJECT`), but it's best to be consistent.

Now we can deploy our cloud run service using this image:

```
$ gcloud run deploy SERVICE \
  --image="gcr.io/PROJECT/endpoints-runtime-serverless:SERVICE_NAME-CONFIG_ID" \
  --allow-unauthenticated \
  --platform managed
```

So something like:

```
$ gcloud run deploy hello-world \
  --image="gcr.io/hello-world-296019/endpoints-runtime-serverless:hello-world-k4csboiwma-nw.a.run.app-2020-11-18r0" \
  --allow-unauthenticated \
  --platform managed
```

Again we're asked for our region, but now after a short wait, we have our API up at the URL we reserved way back in the first step. Nice.

# Automation

If we change the API definition in future, we'll need to repeat all except the first step again. Here's a super basic bash script to repeat these automatically:

```bash
PROJECT="hello-world-296019"
SERVICE="hello-world-k4csboiwma-ew.a.run.app"
SERVICE_SLUG="hello-world"

# Update the service definition
CONFIG_ID=$(gcloud endpoints services deploy openapi.yaml 2>&1 | grep -o 'Configuration \[[0-9a-z\-]*\]' | cut -d '[' -f 2 | sed 's/.$//')
echo "Deployed config id ${CONFIG_ID}"

# Build the docker image
IMAGE_TAG="gcr.io/${PROJECT}/endpoints-runtime-serverless:${SERVICE}-${CONFIG_ID}"

gcloud builds submit --tag "${IMAGE_TAG}" . --project="${PROJECT}"

# Deploy the docker image
gcloud run deploy ${SERVICE_SLUG} \
  --image="${IMAGE_TAG}" \
  --allow-unauthenticated \
  --platform managed \
  --project ${PROJECT}

```

You should be able to customise this to whatever your build process is.

# Finally fixing CORS

Our proxy controls our CORS setup through command line arguments, which we can control through setting environment variables upon deployment. You can see the full details [here](https://cloud.google.com/endpoints/docs/openapi/specify-proxy-startup-options#adding_cors_support_to_esp).

If you want your API to be totally public to everyone use this:

```bash
gcloud run deploy ${SERVICE_SLUG} \
  --image="${IMAGE_TAG}" \
  --allow-unauthenticated \
  --platform managed \
  --set-env-vars="ESPv2_ARGS=--cors_preset=basic" \
  --project ${PROJECT}
```

If you want to restrict it to a specific hostname, for example `http://example.com`:

```bash
gcloud run deploy ${SERVICE_SLUG} \
  --image="${IMAGE_TAG}" \
  --allow-unauthenticated \
  --platform managed \
  --set-env-vars="ESPv2_ARGS=--cors_preset=basic,--cors_allow_origin=http://example.com" \
  --project ${PROJECT}
```

Note that the args in `ESPv2_ARGS` are comma separated.

# Custom domain

Finally, we get to put our serverless functions on a shiny new domain. Head to the cloud console, then the cloud run section and hit 'Manage Custom Domains'. Add a new one, selecting our new proxy service as the target, and link it to whatever domain/subdomain you fancy. Once you do, you'll get an error for a bit while google sorts out a proper SSL certificate and sets it up. But give it half an hour or so and you're done!