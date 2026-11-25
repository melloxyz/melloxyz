import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { renderActivity } from './activity-svg.mjs';

const offline=process.argv.includes('--offline');
const user=process.env.PROFILE_USER || 'melloxyz';
let calendar,now;
if(offline) {
  const snapshot=JSON.parse(readFileSync('data/contributions.json','utf8'));
  if(snapshot.user!==user) throw new Error('Contribution snapshot belongs to a different profile');
  calendar=snapshot.calendar;
  now=new Date(snapshot.fetchedAt);
} else {
  const token=process.env.GITHUB_TOKEN;
  if(!token) throw new Error('Missing GITHUB_TOKEN');
  now=new Date();
  const from=new Date(now);
  from.setUTCFullYear(from.getUTCFullYear()-1);
  const query='query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }';
  const res=await fetch('https://api.github.com/graphql',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/vnd.github+json','User-Agent':'melloxyz-profile-activity'},
    body:JSON.stringify({query,variables:{login:user,from:from.toISOString(),to:now.toISOString()}}),
    signal:AbortSignal.timeout(30000)
  });
  if(!res.ok) throw new Error('GitHub GraphQL HTTP '+res.status+': '+await res.text());
  const body=await res.json();
  if(body.errors?.length) throw new Error(JSON.stringify(body.errors));
  calendar=body.data?.user?.contributionsCollection?.contributionCalendar;
}
const stats=renderActivity(calendar,now);
if(!offline) {
  mkdirSync('data',{recursive:true});
  writeFileSync('data/contributions.json',JSON.stringify({user,fetchedAt:now.toISOString(),calendar},null,2)+'\n');
}
console.log(JSON.stringify({source:offline?'saved GitHub snapshot':'GitHub GraphQL',asOf:now.toISOString(),...stats}));
