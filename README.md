# NJ MVC

This script tells you the fastest appointment dates available to renew your driver's license at each MVC (Licensing Center).

## To run

Set up your slack app and get hook url.

    export SLACK_HOOK_URL=https://hooks.slack.com/services/XXXX
    npm start

## Set up a cron job

    crontab -e

then edit:

    */5 * * * * cd /home/jugyo/njmvc && SLACK_HOOK_URL=https://hooks.slack.com/services/XXXX npm start
