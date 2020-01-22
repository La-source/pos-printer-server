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
  "table",
  "tr",
  "separator",
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

    printing.init();
    this._build(data.elements[0].elements, printing);
  }

  _build(elements, printing, parent) {
    for ( const elt of elements ) {
      if ( elt.type === "text" ) {
        this.text(elt, printing);
      } else if ( tag.includes(elt.name) ) {
        this[elt.name](elt, printing, parent);
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

  separator(elt, printing) {
    const attributes = elt.attributes || {};
    const char = attributes.char || "-";
    printing.print(char.repeat(printing.printer.width));
  }

  style(elt, printing) {
    this._align(elt, printing);
    this._font(elt, printing);
    this._size(elt, printing);
    this._fontFamily(elt, printing);
  }

  _align(elt, printing) {
    if ( !elt.attributes ) {
      return;
    }

    if ( elt.attributes.align ) {
      if ( align.includes(elt.attributes.align) ) {
        printing["align" + this._capitalize(elt.attributes.align)]();
      }
    }
  }

  _font(elt, printing, enable) {
    if ( !enable ) {
      enable = "false";
    }

    if ( !elt.attributes ) {
      return;
    }

    for ( const font of fonts ) {
      if ( elt.attributes[font] ) {
        if ( elt.attributes[font] === enable ) {
          printing[font](false);
        } else {
          printing[font](true);
        }
      }
    }
  }

  _size(elt, printing) {
    if ( !elt.attributes ) {
      return;
    }

    if ( elt.attributes.size ) {
      if ( sizes.includes(elt.attributes.size) ) {
        printing["size" + this._capitalize(elt.attributes.size)]();
      }
    }
  }

  _fontFamily(elt, printing) {
    if ( !elt.attributes ) {
      return;
    }

    if ( elt.attributes.font ) {
      if ( fontFamily.includes(elt.attributes.font) ) {
        printing["font" + this._capitalize(elt.attributes.font)]();
      }
    }
  }

  table(tableElt, printing) {
    const table = {
      tdef: [],
      tr:   [],
    };

    for ( const elt of tableElt.elements ) {
      if ( elt.name === "tdef" ) {
        this.tdef(elt, printing, table);
      } else if ( elt.name === "tr" ) {
        this._tr(elt, printing, table);
      }
    }

    const minLength = table.tdef
      .filter(tdef => !tdef.expand)
      .reduce((acc, curr) => acc + curr.maxLength, 0)
    ;
    const marginMin = (table.tdef.length - 1);
    const nbExpand = table.tdef.filter(tdef => tdef.expand).length;
    const width = printing.printer.width;
    let isFirstExpand = true;
    let index = 0;

    for ( const tdef of table.tdef ) {
      tdef.length = tdef.maxLength;

      if ( tdef.expand ) {
        tdef.length = Math.floor((width - minLength - marginMin) / nbExpand);

        if ( isFirstExpand ) {
          tdef.length += (width - minLength - marginMin) % nbExpand;
          isFirstExpand = false;
        }
      }

      if ( nbExpand === 0 ) {
        tdef.marginRight = Math.floor((width - minLength) / (table.tdef.length - 1));

        if ( index === 0 ) {
          tdef.marginRight += tdef.marginRight = (width - minLength) % (table.tdef.length - 1);
        }
      }

      if ( index === table.tdef.length - 1) {
        tdef.marginRight = 0;
      }

      index++;
    }

    tableElt.table = table;
    this._build(tableElt.elements, printing, tableElt);
  }

  tdef(tdef, _printing, table) {
    for ( const td of tdef.elements ) {
      if ( td.name !== "td" ) {
        continue;
      }

      table.tdef.push(this.tdefDescription(td.attributes));
    }
  }

  _tr(elt, _printing, table) {
    const tr = [];

    elt.elements.forEach((td, index) => {
      const text = td.elements[0].text.trim();
      tr.push(text);

      if ( !table.tdef[index] ) {
        table.tdef[index] = this.tdefDescription({});
      }

      const tdef = table.tdef[index];

      tdef.minLength = Math.min(tdef.minLength, text.length);
      tdef.maxLength = Math.max(tdef.maxLength, text.length);
    });

    table.tr.push(tr);
  }

  tdefDescription(attr) {
    return {
      align:       attr.align || "left",
      expand:      attr.expand === "true" || false,
      // TODO bold & cie
      minLength:   Infinity,
      maxLength:   0,
      length:      0,
      marginRight: 1,
    };
  }

  tr(elt, printing, parent) {
    const table = parent.table;
    let index = 0;

    for ( const td of elt.elements ) {
      if ( td.name !== "td" ) {
        continue;
      }

      const text = td.elements[0].text.trim();
      const tdef = table.tdef[index];
      const width = tdef.length - text.length;
      const middle = Math.floor(width / 2);
      let paddingLeft = "";
      let paddingRight = "";

      switch ( table.tdef[index].align ) {
        case "left":
          paddingRight = " ".repeat(width);
          break;

        case "right":
          paddingLeft = " ".repeat(width);
          break;

        case "center":
          paddingLeft = " ".repeat(middle);
          paddingRight = " ".repeat(width - middle);
          break;
      }

      printing.print(paddingLeft);
      this._td(td, printing, text);
      printing.print(paddingRight + " ".repeat(tdef.marginRight));

      index++;
    }
  }

  _td(elt, printing, text) {
    this._font(elt, printing);
    printing.print(text);
    this._font(elt, printing, "true");
  }

  _capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

module.exports = { Parser };
