# HeksherMgmt
HeksherMgmt is a complimentary service for managing your Heksher instance. It provides an UI for checking settings,
adding and deleting rules, and possibly more later on.
HeksherMgmt is split into frontend ([Vue.js](https://vuejs.org/) and [Vuetify](https://vuetifyjs.com/en/)) and backend ([FastAPI](https://fastapi.tiangolo.com/)).

## How does it work
HeksherMgmt has it's own backend as Heksher API should be used internally only, and we don't want to expose it's internal API.
The internal API is less suited for UI also, so the backend serves as some sort of convinient authorization layer.
HeksherMgmt is a standalone docker image, containing both the front and backend, as splitting those currently feels too synthetic.

## Running it
The backend requires an user header (currently supports only `x-forwarded-email`) to be passed from the reverse proxy.
When running locally, the frontend automatically sends this header, which is of course unsecure in real life environment.

## Deploying
Our recommended deployment is using a sidecar http authentication solution such as [OAuth2-Proxy](http://oauth2-proxy.github.io/oauth2-proxy/).
The sidecar handles authentication, and then passes the authenticated user as a header to Heksher's backend.

## Environment Variables
* `HEKSHERMGMT_HEKSHER_URL`: (required) URL to the Heksher service.
* `HEKSHERMGMT_HEKSHER_HEADERS`: (optional) Headers to send to Heksher service (authorization, api keys, etc). Example - `apitoken:abcd authorization:abcd`
* `SENTRY_DSN`: (optional) Send errors to the given Sentry DSN.
* `HEKSHERMGMT_LOGSTASH_HOST`, `HEKSHERMGMT_LOGSTASH_PORT`, `HEKSHERMGMT_LOGSTASH_LEVEL`, `HEKSHERMGMT_LOGSTASH_TAGS`: Optional values
  to allow sending logs to a logstash server.


## License
HeksherMgmt is registered under the MIT public license.