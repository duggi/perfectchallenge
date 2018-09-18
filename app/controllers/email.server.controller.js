'use strict';

/*
 * Email routes. These handle POSTS from Mailgun for addresses on
 * the mg.tln.io domain. Emails to cds@mg.tln.io with the correct
 * subject line will POST to the /email/ route.
 *
 * The routes will:
 * 1. Determine the team from the sender
 * 2. Determine the week to upload
 * 3. Determine which attachment to post
 * 4. If all goes well,
 * 5.   Post the attachment to a Google Cloud storage bucket
 * 6.   Update the mongo DB with the attahment URL
 * 7. If all does not go well,
 * 8.   Spit out the retry URL.
 *
 * /email/ handles a POST webhook from Mailgun, and processes the data.
 * /email/retry?url=.... handles a manual GET and allows processing messages
 * that fail.
 *
 * TODO /email/addDevRoute set up a cdsdev@mg.tln.io that creates a route for given
 * ngrok.
 */

const {uploadFromUrl} = require('../utils/gcs.server');
const {getStoredMessage} = require('../utils/email.server');

/*
 * Handle the incoming webhook notifiction for stored email. Because this is
 * a webhook, we don't return an error code if we can't process the email,
 * or bother with fancy formatting.
 *
 * We assume the req.body will be the same as we get from a Stored email.
 */
exports.handleIncomingEmail = function(req, res){
  console.log('incoming!', req.body);
  Promise.resolve(req.body)
    .then(handleStoredMessage)
    .then(message => res.send(message));
}

/*
 * Retry the stored email. Because this is a developer tool,
 * we don't return an error code if we can't process the email,
 * or bother with fancy formatting.
 *
 * Pass any extra parameters, as they may aid in reovering the message
 * eg, let developer specify the correct team.
 */
exports.retryStoredEmail = function(req, res) {
  let {url, ...rest} = req.body;
  getStoredMessage(url)
    .then(message => handleStoredMessage(message, rest))
    .then(message => res.send(message));
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/';

/*
 * Return a URL that invokes the retry route with the given URL.
 */
function retryUrl(messageUrl) {
  // TODO how do we determine the server URL?
  return `${BASE_URL}/email/retry?url=${encodeURIComponent(messageUrl)}`;
}

/*
 * Handle message.
 */
function handleStoredMessage(message) {
  const {team, recover} = determineTeam(message);
  if (recover) return sendRetryInfo(recover, message);
  const attachment = determineAttachment(message);
  const week = determineWeek(message);
  const season = 2018;

  // Nothing to process
  if (!team || !week || !attachment) {
    return 'Cannot process';
  }

  const filename = `/lineups/${season}/${week}/${team}`;
  console.log('uploading to', filename);
  uploadFromUrl(filename, attachment.mimetype, attachment.url).then(
    url => setTeamLineupPhoto({team, week, url})
  ).then(() => console.log('success'));

  // Just return right away, so mailgun sees webhook as complete.
  // Hopefully express/heroku allow the background process to continue.
  // We could instead return a promise that resolves after all the work
  // is done.
  return 'Uploading';
}

/* Send retyr information, then return a response to send back
 * to webhook/developer.
 *
 * This could send an email, alert etc, but right now just logs.
 */
function sendRetryInfo(recover, message) {
  console.log(recover);
  console.log(retryUrl(message['message-url']));
  return 'Cannot determine team member. See logs to try again';
}

/**
 * normalize the sender to a team (eg sammon@gmail.com -> rusty)
 * We assume the user part of the email is simple (no weird characters),
 * sufficient and always present.
 *
 * Return {team, recover}, where 'recover' is null, or an {message, params}
 */
function determineTeam(req) {
  let recover;
  const {sender} = req.body;
  let {from} = /([\w.-])@/i.exec(sender)[0];

  // TODO look up from in DB
  const team = {'tony.lownds': tony, 'tony': tony}[from];
  if (!team) recover = {message: `Who is ${from}?`};
  return {team, recover};
}

/**
 * Determine the correct attachment. Currently this is simply,
 * return the first attachment, but this is subject to issues like
 * emoji etc causing issues.
 *
 * Return falsy value if no suitable attachment is found.
 */
function determineAttachment(message) {
  return message.attachments ? message.attachments[0] : null;
}

/**
 * Parse the week number out of the subject line.
 * Ensure the current date is actually within that
 * week, so that stray emails after the week don't
 * mess things up.
 *
 * Return falsy value if no week is determined.
 */
function determineWeek(req) {
  // TODO actually parse shit
  return 2;
}

/* Set something in the mongo DB that we can use.
 * TODO.... what is the schema?
 */
function setTeamLineupPhoto({team, week, url}) {
  // TODO
  console.log('TODO: setTeamLineupPhoto', {team, week, url});
}

