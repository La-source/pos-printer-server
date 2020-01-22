"use string";

const {Server, Printer, EpsonDriver, SerialInterface, UsbInterface, NetworkInterface} = require("../index");

const server = new Server();

const printer1 = new Printer({
  driver:    EpsonDriver,
  interface: new SerialInterface("COM5"),
});

const printer2 = new Printer({
  driver:    EpsonDriver,
  interface: new UsbInterface(8401, 28681),
});

const printer3 = new Printer({
  driver:    EpsonDriver,
  interface: new NetworkInterface("192.168.1.214"),
});

server.on("status", map => {
  for ( const [printer, status] of map.entries() ) {
    console.log(printer.name, {
      notOpen: status.notOpen,
      offline: status.offline,
    });
  }
});

// Warning: The status is badly managed if it is physically the same printer

server
  .addPrinter(printer1)
  .addPrinter(printer2)
  .addPrinter(printer3)
;

const xml = `<printing>
  <style size="doubleHeight" align="center" />
  <p>
    Hello World
    <style size="doubleWidth" />All right ?<style size="normal" />
    <separator />
  </p>
  <style bold="false" size="normal" align="left" />
  <p>
    Hello World 2
    <separator char="=" />
  </p>
  <table>
    <tdef>
      <td align="right" />
      <td align="left" expand="true" />
      <td align="right" />
    </tdef>
    <tr>
      <td>1</td>
      <td>Cola Zero</td>
      <td bold="true">2.20</td>
    </tr>
    <tr>
      <td>2</td>
      <td>Fanta</td>
      <td bold="true">4.40</td>
    </tr>
  </table>
  <table>
    <tdef>
      <td align="left" />
      <td align="right" />
      <td align="right" />
      <td align="right" />
    </tdef>
    <tr>
      <td>Rate</td>
      <td>Basis</td>
      <td>Tax</td>
      <td>Total</td>
    </tr>
    <separator />
    <tr>
      <td>6%</td>
      <td>100.00</td>
      <td>6.00</td>
      <td>106.00</td>
    </tr>
  </table>
  <verticalTab />
  <verticalTab />
  <beep />
  <partialCut />
</printing>`;

server.on("ready", printer => {
  return server.print(printer, xml);
});

setTimeout(() => {
  return server.close();
}, 60e3);
