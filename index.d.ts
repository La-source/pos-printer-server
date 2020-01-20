// Type definitions for pos-printer-server
// Project: pos-printer-server
// Definitions by: Philippe Bauwens

import {EventEmitter} from "events";
import {Element} from "xml-js";
import {Printer, Status, Printing} from "pos-printer";

/**
 * Server printer
 */
export class Server extends EventEmitter {
  /**
   * Status all printers
   */
  get status(): Map<Printer, Status>;

  /**
   * Event on status printer change, return all printer status
   * @param event
   * @param listener
   */
  on(event: "status", listener: (value: Map<Printer, Status>) => any): this;

  /**
   * Add printer
   * @param printer
   */
  addPrinter(printer: Printer): this;

  /**
   * Remove printer
   * @param printer
   */
  removePrinter(printer: Printer): Promise<void>;

  /**
   * Remove all printers
   */
  close(): Promise<void>;

  /**
   * Print XML
   * @param printer
   * @param xml
   */
  print(printer: Printer, xml: string): Promise<void>;

  /**
   * Fetch status printer & emit
   * @param printer
   * @private
   */
  private _fetchStatus(printer: Printer): Promise<void>;

  /**
   * Is status is equal
   * @param prev
   * @param curr
   * @private
   */
  private _statusEqual(prev: Status, curr: Status): boolean;
}

/**
 * Parser xml to Printing
 */
declare class Parser {
  /**
   * Convert xml to Printing
   * @param printing
   * @param xml
   */
  parse(printing: Printing, xml: string): void;

  /**
   * Build text printing
   * @param elements
   * @param printing
   * @private
   */
  private _build(elements: Element[], printing: Printing): void;

  /**
   * convert paragraph
   * @param elt
   * @param printing
   */
  p(elt: Element, printing: Printing): void;

  /**
   * convert text
   * @param elt
   * @param printing
   */
  text(elt: Element, printing: Printing): void;

  /**
   * Convert vertical tab
   * @param elt
   * @param printing
   */
  verticalTab(elt: Element, printing: Printing): void;

  /**
   * Convert beep
   * @param elt
   * @param printing
   */
  beep(elt: Element, printing: Printing): void;

  /**
   * Convert partialCut
   * @param elt
   * @param printing
   */
  partialCut(elt: Element, printing: Printing): void;

  /**
   * Convert cut
   * @param elt
   * @param printing
   */
  cut(elt: Element, printing: Printing): void;

  /**
   * Convert cashDrawer
   * @param elt
   * @param printing
   */
  cashDrawer(elt: Element, printing: Printing): void;

  /**
   * Convert style
   * @param elt
   * @param printing
   */
  style(elt: Element, printing: Printing): void;

  /**
   * Capitalize text
   * @param text
   * @private
   */
  private _capitalize(text: string): string;
}
