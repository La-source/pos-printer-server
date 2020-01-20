"use string";

const {Server, Printer, EpsonDriver, SerialInterface, UsbInterface} = require("../index");

const server = new Server();

const printer1 = new Printer({
  driver:    EpsonDriver,
  interface: new SerialInterface("COM5"),
});

const printer2 = new Printer({
  driver:    EpsonDriver,
  interface: new UsbInterface(8401, 28681),
});

server.on("status", console.log);

server
  .addPrinter(printer1)
  .addPrinter(printer2)
;

const xml = `<printing>
  <style bold="true" size="doubleHeight" align="center" />
  <p>
    Hello World
    <style size="doubleWidth" />All right ?<style size="normal" />
    ------------------------------------------------
  </p>
  <style bold="false" size="normal" align="left" />
  <p>
    Hello World 2
    ------------------------------------------------
  </p>
  <verticalTab />
  <verticalTab />
  <beep />
  <partialCut />
</printing>`;

// setTimeout parceque open est async
setTimeout(() => {
  server.print(printer1, xml);
  server.print(printer2, xml);
}, 500);

setTimeout(() => {
  return server.close();
}, 10e3);
