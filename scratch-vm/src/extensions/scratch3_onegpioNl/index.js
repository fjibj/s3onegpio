/*
This is the Scratch 3 extension to remotely control an
Arduino Uno, ESP-8666, Raspberry Pi, or Newland


 Copyright (c) 2019 Alan Yorinks All rights reserved.

 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 Version 3 as published by the Free Software Foundation; either
 or (at your option) any later version.
 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 General Public License for more details.

 You should have received a copy of the GNU AFFERO GENERAL PUBLIC LICENSE
 along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

// Boiler plate from the Scratch Team
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

require('sweetalert');

// The following are constants used within the extension

// Digital Modes
const DIGITAL_INPUT = 1;
const DIGITAL_OUTPUT = 2;
const PWM = 3;
const SERVO = 4;
const TONE = 5;
const SONAR = 6;
const ANALOG_INPUT = 7;

// an array to save the current pin mode
// this is common to all board types since it contains enough
// entries for all the boards.
// Modes are listed above - initialize to invalid mode of -1
let pin_modes = new Array(30).fill(-1);

// has an websocket message already been received
let alerted = false;

let connection_pending = false;

// general outgoing websocket message holder
let msg = null;

// the pin assigned to the sonar trigger
// initially set to -1, an illegal value
let sonar_report_pin = -1;

// flag to indicate if the user connected to a board
let connected = false;

// arrays to hold input values
let digital_inputs = new Array(32);
let analog_inputs = new Array(8);

// flag to indicate if a websocket connect was
// ever attempted.
let connect_attempt = false;

// an array to buffer operations until socket is opened
let wait_open = [];

let the_locale = null;

let ws_ip_address = '127.0.0.1';

// common
const FormDigitalWrite = {
    'pt-br': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'pt': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'en': 'Write Digital Pin [PIN] [ON_OFF]',
    'fr': 'Mettre la pin numérique[PIN]à[ON_OFF]',
    'zh-tw': '写TXT文件，文件路径[TXT_PATH]',
    'zh-cn': '写TXT文件，文件路径[TXT_PATH]',
    'pl': 'Ustaw cyfrowy Pin [PIN] na [ON_OFF]',
};

const FormPwmWrite = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '腳位[PIN]類比輸出[VALUE]%',
    'zh-cn': '脚位[PIN]类比输出[VALUE]%',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const FormTone = {
    'pt-br': 'Definir Buzzer no Pino[PIN]com[FREQ]Hz e[DURATION]ms',
    'pt': 'Definir Buzzer no Pino[PIN]com[FREQ]Hz  e[DURATION]ms',
    'en': 'Tone Pin [PIN] [FREQ] Hz [DURATION] ms',
    'fr': 'Définir le buzzer sur la pin[PIN]à[FREQ]Hz pendant[DURATION] ms',
    'zh-tw': '腳位[PIN]播放音調，頻率為[FREQ]時間為[DURATION]',
    'zh-cn': '脚位[PIN]播放音调，频率为[FREQ]时间为[DURATION]',
    'pl': 'Ustaw brzęczyk na Pinie [PIN] na [FREQ] Hz i [DURATION] ms%',
};

const FormServo = {
    'pt-br': 'Mover Servo Motor no[PIN]para[ANGLE]°',
    'pt': 'Mover Servo Motor no[PIN]para[ANGLE]°',
    'en': 'Write Servo Pin [PIN] [ANGLE] Deg.',
    'fr': 'Mettre le servo[PIN]à[ANGLE] Deg.',
    'zh-tw': '伺服馬達腳位[PIN]轉動角度到[ANGLE]度',
    'zh-cn': '伺服马达脚位[PIN]转动角度到[ANGLE]度',
    'pl': 'Ustaw silnik servo na Pinie [PIN] na [ANGLE]°',
};

const FormAnalogRead = {
    'pt-br': 'Ler Pino Analógico [PIN]',
    'pt': 'Ler Pino Analógico [PIN]',
    'en': 'Read Analog Pin [PIN]',
    'fr': 'Lecture analogique [PIN]',
    'zh-tw': '讀取類比腳位[PIN]',
    'zh-cn': '读取类比脚位[PIN]',
    'pl': 'Odczytaj analogowy Pin [PIN]',
};

const FormDigitalRead = {
    'pt-br': 'Ler Pino Digital [PIN]',
    'pt': 'Ler Pino Digital [PIN]',
    'en': 'Read Digital Pin [PIN]',
    'fr': 'Lecture numérique [PIN]',
    'zh-tw': '讀取數位腳位[PIN]',
    'zh-cn': '读取数位脚位[PIN]',
    'pl': 'Odczytaj cyfrowy Pin [PIN]',
};

const FormSonarRead = {
    'pt-br': 'Ler Distância: Sonar em T[RADIUS_SIZE] E[COLOR]',
    'pt': 'Ler Distância: Sonar em T[RADIUS_SIZE] E[COLOR]',
    'en': 'Read SONAR  T [RADIUS_SIZE]  E [COLOR]',
    'fr': 'Distance de lecture : Sonar T [RADIUS_SIZE] E [COLOR]',
    'zh-tw': '画一个圆，半径[RADIUS_SIZE]颜色[COLOR]',
    'zh-cn': '画一个圆，半径[RADIUS_SIZE]颜色[COLOR]',
    'pl': 'Odczytaj odległość: Sonar T [RADIUS_SIZE]  E [COLOR]',
};

// ESP-8266 specific

const FormIPBlockE = {
    'pt-br': 'Endereço IP da placa ESP-8266 [IP_ADDR]',
    'pt': 'Endereço IP da placa ESP-8266 [IP_ADDR]',
    'en': 'ESP-8266 IP Address [IP_ADDR]',
    'fr': "Adresse IP de l'ESP-8266 [IP_ADDR]",
    'zh-tw': 'ESP-8266 IP 位址[IP_ADDR]',
    'zh-cn': 'ESP-8266 IP 地址[IP_ADDR]',
    'pl': 'Adres IP ESP-8266 [IP_ADDR]',
};

// Raspbery Pi Specific
const FormIPBlockR = {
    'pt-br': 'Endereço IP do RPi [IP_ADDR]',
    'pt': 'Endereço IP do RPi [IP_ADDR]',
    'en': 'Remote IP Address [IP_ADDR]',
    'fr': 'Adresse IP du RPi [IP_ADDR]',
    'zh-tw': '遠端 IP 位址[IP_ADDR]',
    'zh-cn': '远程 IP 地址[IP_ADDR]',
    'pl': 'Adres IP Rasberry Pi [IP_ADDR]',
};

// General Alert
const FormWSClosed = {
    'pt-br': "A Conexão do WebSocket está Fechada",
    'pt': "A Conexão do WebSocket está Fechada",
    'en': "WebSocket Connection Is Closed.",
    'fr': "La connexion WebSocket est fermée.",
    'zh-tw': "網路連線中斷",
    'zh-cn': "网絡连线中断",
    'pl': "Połączenie WebSocket jest zamknięte.",
};



class Scratch3NlOneGPIO {
    constructor(runtime) {
        the_locale = this._setLocale();
        this.runtime = runtime;
    }

    getInfo() {
        the_locale = this._setLocale();
        //this.connect();

        return {
            id: 'onegpioNl',
            color1: '#0C5986',
            color2: '#34B0F7',
            name: 'OneGpio Newland',
            blockIconURI: 'data:image/png;base64,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',
            blocks: [
                {
                    opcode: 'ip_address',
                    blockType: BlockType.COMMAND,
                    //text: 'Write Digital Pin [PIN] [ON_OFF]',
                    text: FormIPBlockR[the_locale],

                    arguments: {
                        IP_ADDR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                            //menu: "digital_sizes"
                        },

                    }

                },
                '---',
				/*
                {
                    opcode: 'draw_circle',
                    //blockType: BlockType.REPORTER,
					blockType: BlockType.COMMAND,
                    text: FormSonarRead[the_locale],
					
					arguments: {
                        RADIUS_SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                            menu: 'digital_sizes'
                        },
                        COLOR: {
                            type: ArgumentType.STRING,
                            defaultValue: 'red',
                            menu: 'colors'
                        }
                    }
                },
				*/
				{
                    opcode: 'write_txt',
                    //blockType: BlockType.REPORTER,
					blockType: BlockType.COMMAND,
                    text: FormDigitalWrite[the_locale],
					
					arguments: {
                        TXT_PATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                            //menu: 'digital_sizes'
                        }
                    }
                },
            ],
            menus: {
                digital_sizes: {
                    acceptReporters: true,
                    items: ['10', '20', '30', '40', '50', '60', '70',
                        '80', '90', '100', '200']
                },
                colors: {
                    acceptReporters: true,
                    items: ['red', 'yellow', 'blue']
                },

                on_off: {
                    acceptReporters: true,
                    items: ['0', '1']
                }
            }
        };
    }

    // The block handlers

    // command blocks

    ip_address(args) {
        if (args['IP_ADDR']) {
            ws_ip_address = args['IP_ADDR'];
            if (!connected) {
                if (!connection_pending) {
                    this.connect();
                    connection_pending = true;
                }
            }

        }

    }


    write_txt(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.write_txt.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let txt_path = args['TXT_PATH'];
			msg = {"command": "write_txt", "txt_path": txt_path};
			msg = JSON.stringify(msg);
			window.socketr.send(msg);
            //return digital_inputs[sonar_report_pin];

        }
    }

	draw_circle(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.draw_circle.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let radius_size = args['RADIUS_SIZE'];
            radius_size = parseInt(radius_size, 10);
            sonar_report_pin = radius_size;
            let line_color = args['COLOR'];
            //line_color = parseInt(line_color, 10);
			msg = {"command": "draw_circle", "radius_size": radius_size, "line_color": line_color};
			msg = JSON.stringify(msg);
			window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];

        }
    }

    _setLocale () {
        let now_locale = '';
        switch (formatMessage.setup().locale){
            case 'pt-br':
            case 'pt':
                now_locale='pt-br';
                break;
            case 'en':
                now_locale='en';
                break;
            case 'fr':
                now_locale='fr';
                break;
            case 'zh-tw':
                now_locale= 'zh-tw';
                break;
            case 'zh-cn':
                now_locale= 'zh-cn';
                break;
            case 'pl':
                now_locale='pl';
                break;
            default:
                now_locale='en';
                break;
        }
        return now_locale;
    }

    // end of block handlers

    // helpers
    connect() {
        if (connected) {
            // ignore additional connection attempts
            return;
        } else {
            connect_attempt = true;
            let url = "ws://" + ws_ip_address + ":9001";
            console.log(url);
            //window.socketr = new WebSocket("ws://127.0.0.1:9001");
            window.socketr = new WebSocket(url);
            msg = JSON.stringify({"id": "to_nl_gateway"});
        }


        // websocket event handlers
        window.socketr.onopen = function () {

            digital_inputs.fill(0);
            analog_inputs.fill(0);
            // connection complete
            connected = true;
            connect_attempt = true;
            // the message is built above
            try {
                //ws.send(msg);
                window.socketr.send(msg);

            } catch (err) {
                // ignore this exception
            }
            for (let index = 0; index < wait_open.length; index++) {
                let data = wait_open[index];
                data[0](data[1]);
            }
        };

        window.socketr.onclose = function () {
            digital_inputs.fill(0);
            analog_inputs.fill(0);
            pin_modes.fill(-1);
            if (alerted === false) {
                alerted = true;
                alert(FormWSClosed[the_locale]);}
            connected = false;
        };

        // reporter messages from the board
        window.socketr.onmessage = function (message) {
            msg = JSON.parse(message.data);
            let report_type = msg["report"];
            let pin = null;
            let value = null;

            // types - digital, analog, sonar
            if (report_type === 'digital_input') {
                pin = msg['pin'];
                pin = parseInt(pin, 10);
                value = msg['value'];
                digital_inputs[pin] = value;
            } else if (report_type === 'analog_input') {
                pin = msg['pin'];
                pin = parseInt(pin, 10);
                value = msg['value'];
                analog_inputs[pin] = value;
            } else if (report_type === 'sonar_data') {
                value = msg['value'];
                digital_inputs[sonar_report_pin] = value;
            }
        };
    }


}

module.exports = Scratch3NlOneGPIO;
