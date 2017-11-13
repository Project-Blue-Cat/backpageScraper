readme.txt

'''''''''''''''''
overview

'''''''''''''''''

backpageScraper

git
https://console.cloud.google.com/code/develop/browse/hack/master/collection/functions/backpage-scraper?project=project-blue-cat

flow
- inputs 
  - { "category" : "TherapeuticMassage" }
- scrapes backpage.com (for the given category)
  - data storage
    - GCP Datastore
		- Entity:  ProductListContent
		  - the list page
	  	- Entity:  ProductContent
	  	  - the product page
	  	  - images:  json contruct for all images on the page
	  	  - imageStoragePath:  path within GCP Storage where the images for the given product page
	  	    - note - images are not saved to GCP Storage within this function, this is done within the image-collector function


'''''''''''''''''
dev setup

'''''''''''''''''
Installing Cloud SDK
https://cloud.google.com/sdk/downloads

NodeJS / NPM
https://nodejs.org/en/download/

Quickstart Using the Command-Line
https://cloud.google.com/ml-engine/docs/quickstarts/command-line


'''''''''''''''''
run / test

'''''''''''''''''

locally
install local emmulator
https://cloud.google.com/functions/docs/emulator

cd to function directory /collection/functions/backpage-scraper

start emulator
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" start

deploy function to local emulator
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" deploy backpageScraper --trigger-http

call function (deployed to local emulator)
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" call backpageScraper --data '{ \"category\":\"ComputerServices\" }'

reading the logs (when run locally)
...  console.log('a log message');
https://cloud.google.com/functions/docs/monitoring/logging


call the deployed version via commandline
gcloud beta functions call backpageScraper --data '{ \"category\":\"ComputerServices\" }'


call from GCP console
https://console.cloud.google.com/functions/details/us-central1/backpageScraper?project=project-blue-cat&tab=testing&duration=PT1H
{ "category" : "ComputerServices" }
{ "category" : "TherapeuticMassage" }

'''''''''''''''''
deploy to GCP

'''''''''''''''''
https://cloud.google.com/functions/docs/deploying/

from local
gcloud beta functions deploy backpageScraper --stage-bucket project-blue-cat-functions --trigger-http

from git
gcloud beta functions deploy backpageScraper --source-url https://source.developers.google.com/p/project-blue-cat/r/hack --source-path /collection/functions/backpage-scraper --trigger-http
