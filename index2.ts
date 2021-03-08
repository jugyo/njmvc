import fetch from "node-fetch";

async function get(id: number) {
  const res = await fetch(
    `https://telegov.njportal.com/njmvc/CustomerCreateAppointments/GetNextAvailableDate?appointmentTypeId=11&locationId=${id}`
  );
  const data = JSON.parse(await res.text());
  const date = new Date(data.next);
  return { date, data };
}

function formatData(data: any[]) {
  return data
    .map((item) => {
      return `
${item.date.toDateString()} <${item.url}|${item.location}>
    `.trim();
    })
    .join("\n\n");
}

interface Result {
  date: Date;
}

async function notify(results: Result[], slackHookUrl: string) {
  const now = new Date();
  const filtered = results
    .filter((i) => !isNaN(i.date.getTime()))
    .filter((i) => i.date.getTime() - now.getTime() < 24 * 3600 * 1000 * 14);

  if (filtered.length === 0) {
    console.log("Skip to notify");
    return;
  }

  const markdown = formatData(filtered);

  await fetch(slackHookUrl, {
    method: "post",
    body: JSON.stringify({ text: markdown }),
    headers: { "Content-Type": "application/json" },
  });
}

if (require.main === module) {
  const locations = [
    {
      id: 101,
      location: "Bakers Basin",
    },
    {
      id: 102,
      location: "Bayonne",
    },
    {
      id: 103,
      location: "Rio Grande",
    },
    {
      id: 104,
      location: "Camden",
    },
    {
      id: 105,
      location: "Cardiff ",
    },
    {
      id: 106,
      location: "Salem",
    },
    {
      id: 107,
      location: "Delanco",
    },
    {
      id: 108,
      location: "Eatontown",
    },
    {
      id: 109,
      location: "South Plainfield",
    },
    {
      id: 110,
      location: "Edison",
    },
    {
      id: 111,
      location: "Flemington",
    },
    {
      id: 112,
      location: "Toms River",
    },
    {
      id: 113,
      location: "Freehold",
    },
    {
      id: 114,
      location: "Lodi",
    },
    {
      id: 115,
      location: "Vineland",
    },
    {
      id: 116,
      location: "Newark",
    },
    {
      id: 117,
      location: "North Bergen",
    },
    {
      id: 118,
      location: "Wayne",
    },
    {
      id: 119,
      location: "Oakland",
    },
    {
      id: 120,
      location: "Paterson",
    },
    {
      id: 121,
      location: "West Deptford",
    },
    {
      id: 122,
      location: "Rahway",
    },
    {
      id: 123,
      location: "Randolph",
    },
  ];

  (async () => {
    const result = await Promise.all(
      locations.map(async (l) => {
        const res = await get(l.id);
        return {
          ...l,
          ...res,
          url: `https://telegov.njportal.com/njmvc/AppointmentWizard/11/${l.id}`,
        };
      })
    );

    console.log(JSON.stringify(result, null, 2));

    await notify(result, process.env.SLACK_HOOK_URL);
  })();
}
