const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: "students-base-e5cf1",
  private_key_id: "37c6c62c39512d2865b82289ecfb86962d575837",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAfhyBVt8m1/Kv\n3pQI+sIbIh/US5su9lg714QfF75O3ihkMhERZEAa35x6cryr3CeGqPnEPEkdZ2zM\n8FDusZxVJXDwv8s0HP4s4Gv65axP0+GacxFTFdQG4rVf8uslXgnjzT1RpA59+Ofp\nIhG5gFhomtkbiLqju2kHYxYmkvJs1J+mrW9OG34wDT9eJfiocd1zPUMjbZKflMz0\nqR82pZILNo3FBNnWoO/XyJSZN080uRab52e+njqaWVo/Pck3bi352P6OT/d2gMKx\nU2OwhuMfbeSJ69g2wttFDBn+jzyahQWRBN7bx8igpux6CamwWfPqr2A4mep1UcMT\nufNorAvvAgMBAAECggEAVHQgKokEQAUX55x2g5gNKJ1orJp9W/XeEWdFguTGbNDg\nlNE4ltJOo9u+yiRj7d0aBGVHrBatF3cEj8fSIl+PkPXr3tyvGU6tH+BYz8wLtTxn\na32XuMXHcDvwSsgH7i2bljQ6doLNjuxxR2JYt3P9let2XLO4+1QiyQhqtALd1OwT\nZ5t1CVA7Dm1yJSnCpWQ9kT4ec5GVsYG5KGLsreFXntgCLFg1m/TzWgtK+quQJ/Ok\nYXQHmOspy8nJTGp9fukYYTuCTMF83u69/zHNzbcYnc5lh6ph5mBtoD5jE7WrIoho\nMDXNrbfPHsyhB4tsE0DFBJ4dVGa6t1sraJuu5T8jAQKBgQDtEC4r3ZgG/RecD5NL\n36bfke2H203j8jcKDyjiYTBFAUixYCPIG1xpI72cmYqZPE1OF+l9RLQhV/FCWtP6\n9J4fqAD1j2bTM3LURAukoOpW1klie8T5g7UzC9ADqPD/yvnbBVs99z1FXWli9BZT\nAlMkG7xXbvmrGvtQDhQLPxVC7wKBgQDP3nxWYhwxgL4spKw855KRUX2s1aLo32GO\nnZRimCQoFYmwrQcfSioe7Uj79gTIkJIZln5fK/kTlYEmmmOVRsqquG2kDp0OxAWK\naH34v9/xV9QT0IPr+xUQiqVjQyH8J0aodp/QSgC1n31EroFd6YGZRJv4Q1QfnvJ/\nuFg8GmHHAQKBgGFOs/UTh3TO7KMFjaumSSQaDUsnzMgVQ1xgrqKFzD928HTGhsl7\n2anantkp+Uc/BmhYzmG6EsphA8n96Gdpg4Jw/rvNOiLVSnww1iqkVqyAVy0Sqt7U\nnksuvRrTfOEyWu75OuOrmb3gQwL4ODWojaITtHKbPeZrM98/eCDJqxuHAoGBAJrQ\njzYe9/R+eCTzuDvcFLMaSElzC1P5GsWG4z7TJQqdj+D/3TAWomxKOXM+da2Szt0z\n0oa7T1SgooHHtqc1BDhGB5KKN7sJjz7YOAoNjZJH4XGoeLhGVhftyuO02hjcf6l0\nP+53TzP1xuxiM4NoJ9eo26j5LCwoy18IQt7wnyYBAoGADV1Z6egjiyTCEmVjaOiK\nhsPidS4OBAVNRxF1O1iKdQcnE3CLJfuy8/xV7zUU03Due7jlTJROVZ7nxX29PSA6\nCqJoBDD5S0aRZe/Gl6pGExsbZgBDB8Mqa1q6yI9xwDfi+iyxxG9KnKGipIV2xju9\nzEIhJKgttySr2WHgIqWe16g=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@students-base-e5cf1.iam.gserviceaccount.com",
  client_id: "117796540932673902633",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40students-base-e5cf1.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
