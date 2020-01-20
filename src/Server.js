"use strict";

const EventEmitter = require("events");
const { Parser } = require("./Parser");

class Server extends EventEmitter {
  constructor() {
    super();
    this.printers = new Set();
    this.statusSubscription = new Map();
    this._status = new Map();
  }

  get status() {
    return this._status;
  }

  addPrinter(printer) {
    this.printers.add(printer);
    this.statusSubscription.set(printer, setInterval(() => this._fetchStatus(printer), 1e3));
    this._fetchStatus(printer)
      .catch(err => console.warn("unable fetch status", err))
    ;

    return this;
  }

  removePrinter(printer) {
    this.printers.delete(printer);
    clearInterval(this.statusSubscription.get(printer));
    this.statusSubscription.delete(printer);

    return printer.close();
  }

  close() {
    return Promise
      .all(Array.from(this.printers)
        .map(printer => this.removePrinter(printer)))
    ;
  }

  print(printer, xml) {
    const parser = new Parser();
    const printing = printer.createPrinting();
    parser.parse(printing, xml);
    return printer.execute(printing);
  }

  async _fetchStatus(printer) {
    if ( !printer.isOpen ) {
      try {
        await printer.open();
      } catch (err) {
        // TODO emit status notOpen
        return;
      }
    }

    const status = await printer.status();
    const prevStatus = this._status.get(printer);

    if ( this._statusEqual(prevStatus, status) ) {
      return;
    }

    this._status.set(printer, status);
    this.emit("status", this.status);
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
