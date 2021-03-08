import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs = require("fs");

async function fetchPage(url: string, cache: boolean = false) {
  const cacheFilePath = `./tmp/${encodeURIComponent(url)}`;

  if (cache) {
    try {
      const cache = fs.readFileSync(cacheFilePath).toString("utf-8");
      if (cache) {
        return cache;
      }
    } catch (error) {}
  }

  const res = await fetch(url);
  const data = await res.text();

  if (cache) {
    fs.writeFileSync(cacheFilePath, data);
  }

  return data;
}

function formatData(data: any[]) {
  return data
    .map((item) => {
      const alert = item.alert.length > 0 ? `alert: ${item.alert}` : "";
      return `
${item.date} <${item.url}|${item.location}> ${alert}
    `.trim();
    })
    .join("\n\n");
}

const lastNotificationFilePath = "/tmp/njmvc-last-notification";

async function notify(data: any[], slackHookUrl: string) {
  const filtered = data.filter(
    (i) => i.alert.length === 0 && i.date.match(/April|March/)
  );
  if (filtered.length === 0) {
    console.log("Skip to notify");
    return;
  }
  const markdown = formatData(filtered);

  let lastNotification: string;
  try {
    lastNotification = fs
      .readFileSync(lastNotificationFilePath)
      .toString("utf-8");
  } catch (error) {}

  if (markdown === lastNotification) {
    console.log("Skip to notify. Same notification as last one");
    return;
  }

  await fetch(slackHookUrl, {
    method: "post",
    body: JSON.stringify({ text: markdown }),
    headers: { "Content-Type": "application/json" },
  });

  fs.writeFileSync(lastNotificationFilePath, markdown);
}

async function scrape(id) {
  const url = `https://telegov.njportal.com/njmvc/AppointmentWizard/11/${id}`;
  const page = await fetchPage(url, process.env.NODE_ENV !== "production");
  const $ = cheerio.load(page);
  const timeOfAppointment = $(".control-label[for!=holdDate]").text(); // ie. "Time of Appointment for March 06, 2021: "
  const date = timeOfAppointment
    .replace("Time of Appointment for ", "")
    .replace(": ", "");
  const alert = $("#timeslots .alert").text().trim();
  const navItem = $(".setup-panel li.nav-item:nth-child(1)").text(); // ie. "West Deptford - License or Non Driver ID Renewal"
  const location = navItem.replace(/ -.*/, "");

  return { id, location, date, url, alert };
}

if (require.main === module) {
  const ids = [
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    123,
  ];

  (async () => {
    const result = [];
    for (const id of ids) {
      const res = await scrape(id);
      result.push(res);
    }
    await notify(result, process.env.SLACK_HOOK_URL);
  })();
}
