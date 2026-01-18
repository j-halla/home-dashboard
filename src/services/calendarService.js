import fetch from 'node-fetch';
import { config, germanMonths } from '../config/index.js';

class CalendarService {
  constructor() {
    this.data = { cardboard: [], paper: [], mrgreen: [] };
  }

  convertGermanDate(dateStr) {
    const [day, month, year] = dateStr.split(' ');
    const paddedDay = day.replace('.', '').padStart(2, '0');
    const monthNum = germanMonths[month];
    return `${year}-${monthNum}-${paddedDay}`;
  }

  async updateData() {
    const { zip, types, mrGreenType, limitResponse, limitEntries, openerzApiUrl, mrGreenApiUrl } =
      config.calendar;

    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const openerzApi = `${openerzApiUrl}?zip=${zip}&types=${types.join('&types=')}&start=${start}&sort=date&offset=0&limit=${limitResponse}`;

    try {
      // Fetch waste collection data from OpenERZ
      const response = await fetch(openerzApi);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const erzData = await response.json();

      // Reset data
      this.data = { cardboard: [], paper: [], mrgreen: [] };

      // Process OpenERZ results
      erzData.result.forEach((item) => {
        if (
          this.data.hasOwnProperty(item.waste_type) &&
          this.data[item.waste_type].length < limitEntries
        ) {
          this.data[item.waste_type].push(item.date);
        }
      });

      // Fetch Mr. Green data
      const mrGreenResponse = await fetch(mrGreenApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip, type: mrGreenType }),
      });

      if (!mrGreenResponse.ok) {
        throw new Error(`HTTP error! status: ${mrGreenResponse.status}`);
      }

      const mrGreenData = await mrGreenResponse.json();

      this.data.mrgreen = mrGreenData.dates_data[0].date
        .slice(0, 3)
        .map((date) => this.convertGermanDate(date));

      console.log('[CalendarService] Data updated successfully');
    } catch (error) {
      console.error('[CalendarService] Error updating data:', error.message);
    }
  }

  getData() {
    return this.data;
  }

  startPolling() {
    this.updateData();
    setInterval(() => this.updateData(), config.calendar.updateInterval);
  }
}

export const calendarService = new CalendarService();
