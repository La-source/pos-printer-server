"use string";

const {xml2js} = require("xml-js");

const tag = [
  "verticalTab",
  "beep",
  "partialCut",
  "cut",
  "cashDrawer",
  "style",
  "p",
];

const fonts = [
  "bold",
  "underline",
  "underlineThick",
  "upsideDown",
  "invert",
];

const sizes = [
  "normal",
  "doubleHeight",
  "doubleWidth",
  "quadArea",
];

const align = [
  "center",
  "left",
  "right",
];

const fontFamily = [
  "A",
  "B",
];

class Parser {
  parse(printing, xml) {
    const data = xml2js(xml);

    if ( data.elements.length === 0 ) {
      throw new Error("Xml is empty");
    }

    if ( data.elements[0].name !== "printing" ) {
      throw new Error("Xml is not printing type");
    }

    this._build(data.elements[0].elements, printing);
  }

  _build(elements, printing) {
    for ( const elt of elements ) {
      if ( elt.type === "text" ) {
        this.text(elt, printing);
      } else if ( tag.includes(elt.name) ) {
        this[elt.name](elt, printing);
      }
    }
  }

  p(elt, printing) {
    this._build(elt.elements, printing);
  }

  text(elt, printing) {
    printing.print(elt.text.trim()
      .replace(/^[ \t\r]+|[ \t\r]+$/gm, "") + "\n");
  }

  verticalTab(elt, printing) {
    printing.verticalTab();
  }

  beep(elt, printing) {
    printing.beep();
  }

  partialCut(elt, printing) {
    printing.partialCut();
  }

  cut(elt, printing) {
    printing.cut();
  }

  cashDrawer(elt, printing) {
    printing.cashDrawer();
  }

  style(elt, printing) {
    for ( const font of fonts ) {
      if ( elt.attributes[font] ) {
        if ( elt.attributes[font] === "false" ) {
          printing[font](false);
        } else {
          printing[font](true);
        }
      }
    }

    if ( elt.attributes.size ) {
      if ( sizes.includes(elt.attributes.size) ) {
        printing["size" + this._capitalize(elt.attributes.size)]();
      }
    }

    if ( elt.attributes.align ) {
      if ( align.includes(elt.attributes.align) ) {
        printing["align" + this._capitalize(elt.attributes.align)]();
      }
    }

    if ( elt.attributes.font ) {
      if ( fontFamily.includes(elt.attributes.font) ) {
        printing["font" + this._capitalize(elt.attributes.font)]();
      }
    }
  }

  _capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

module.exports = { Parser };
