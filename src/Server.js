"use strict";

const EventEmitter = require("events");
const { Parser } = require("./Parser");

class Server extends EventEmitter {
  constructor() {
    super();
    this.printers = new Set();
    this.statusSubscription = new Map();
    this._status = new Map();
    this._onFetchStatus = new Map();
    this._errors = new Map();
    this._ready = new Set();
  }

  get status() {
    return this._status;
  }

  addPrinter(printer) {
    this.printers.add(printer);
    this._onFetchStatus.set(printer, false);
    this._errors.set(printer, 0);
    this._ready.add(printer);
    this.statusSubscription.set(printer, setInterval(() => this._fetchStatus(printer), 1e3));
    this._fetchStatus(printer);

    return this;
  }

  removePrinter(printer) {
    this.printers.delete(printer);
    clearInterval(this.statusSubscription.get(printer));
    this._onFetchStatus.delete(printer);
    this._errors.delete(printer);
    this._ready.delete(printer);
    this.statusSubscription.delete(printer);

    return printer.close();
  }

  close() {
    return Promise.all(
      Array
        .from(this.printers)
        .map(printer => this.removePrinter(printer)),
    );
  }

  print(printer, xml) {
    const parser = new Parser();
    const printing = printer.createPrinting();
    parser.parse(printing, xml);
    return printer.execute(printing);
  }

  async _fetchStatus(printer) {
    // If status is currently fetched
    if ( this._onFetchStatus.get(printer) ) {
      return;
    }

    this._onFetchStatus.set(printer, true);

    if ( !printer.isOpen ) {
      try {
        await printer.open();
      } catch (err) {
        console.warn("Unable open printer " + printer.name, err);

        this._onFetchStatus.set(printer, false);
        return this._emitStatusNotOpen(printer);
      }

      if ( this._ready.has(printer) ) {
        this._ready.delete(printer);
        this.emit("ready", printer);
      }
    }

    try {
      const status = await printer.status();
      status.notOpen = false;
      this._emitStatus(printer, status);
      this._errors.set(printer, 0);
    } catch ( err ) {
      console.warn("error fetch status " + printer.name, err);
      this._errors.set(printer, this._errors.get(printer) + 1);

      if ( this._errors.get(printer) >= 3 ) {
        console.log("close printer too many error");
        this._errors.set(printer, 0);
        this._emitStatusNotOpen(printer);

        try {
          await printer.close();
        } catch (err) {
          console.warn("unable close printer", err);
        }
      }
    }

    this._onFetchStatus.set(printer, false);
  }

  _emitStatus(printer, status) {
    const prevStatus = this._status.get(printer);

    if ( this._statusEqual(prevStatus, status) ) {
      return;
    }

    this._status.set(printer, status);
    this.emit("status", this.status);
  }

  _emitStatusNotOpen(printer) {
    this._emitStatus(printer, {
      notOpen: true,
      ...printer.driver.getPrinterStatus(Buffer.from([])),
      ...printer.driver.getOfflineStatus(Buffer.from([])),
      ...printer.driver.getErrorStatus(Buffer.from([])),
      ...printer.driver.getPaperRollStatus(Buffer.from([])),
    });
  }

  _statusEqual(prev, curr) {
    if ( !prev ) {
      return false;
    }

    for ( const key in prev ) {
      if ( prev[key] !== curr[key] ) {
        return false;
      }
    }

    return true;
  }
}

module.exports = { Server };
