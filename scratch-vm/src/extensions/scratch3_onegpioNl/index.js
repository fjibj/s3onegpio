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
let client_code = false;

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
const OutPutScreen = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '控制台输出[PRINT_INFO]',
    'zh-cn': '控制台输出[PRINT_INFO]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const FormDigitalWrite = {
    'pt-br': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'pt': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'en': 'Write Digital Pin [PIN] [ON_OFF]',
    'fr': 'Mettre la pin numérique[PIN]à[ON_OFF]',
    'zh-tw': '写TXT文件，文件路径[TXT_PATH]',
    'zh-cn': '写TXT文件，文件路径[TXT_PATH]',
    'pl': 'Ustaw cyfrowy Pin [PIN] na [ON_OFF]',
};

const FormTransWrite = {
    'pt-br': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'pt': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'en': 'Write Digital Pin [PIN] [ON_OFF]',
    'fr': 'Mettre la pin numérique[PIN]à[ON_OFF]',
    'zh-tw': '写入一个数字[TRANS_NUM]',
    'zh-cn': '写入一个数字[TRANS_NUM]',
    'pl': 'Ustaw cyfrowy Pin [PIN] na [ON_OFF]',
};

const FormDistinguishInvoice = {
    'pt-br': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'pt': 'Definir Pino Digital[PIN]como[ON_OFF]',
    'en': 'Write Digital Pin [PIN] [ON_OFF]',
    'fr': 'Mettre la pin numérique[PIN]à[ON_OFF]',
    'zh-tw': '识别[IMAGE_PATH]发票，写入[CSV_PATH]',
    'zh-cn': '识别[IMAGE_PATH]发票，写入[CSV_PATH]',
    'pl': 'Ustaw cyfrowy Pin [PIN] na [ON_OFF]',
};

const CreateCSV = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '创建CSV文件[CSV_PATH]',
    'zh-cn': '创建CSV文件[CSV_PATH]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const OpenCSV = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '打开CSV文件[CSV_PATH]展示5秒',
    'zh-cn': '打开CSV文件[CSV_PATH]展示5秒',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const AutoWrite = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '网站[WEB_SITE]填入用户[USER_NAME],职位[DEPARTMENT],表格路径[CSV_PATH]自动报销',
    'zh-cn': '网站[WEB_SITE]填入用户[USER_NAME],职位[DEPARTMENT],表格路径[CSV_PATH]自动报销',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const ShowInfo = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '展示[IMAGE_PATH][CSV_PATH][TOTAL_PATH]信息1分钟',
    'zh-cn': '展示[IMAGE_PATH][CSV_PATH][TOTAL_PATH]信息1分钟',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const SendWechat = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '向微信群[GROUP_NAME]发送用户[USER_NAME]发票提交完成',
    'zh-cn': '向微信群[GROUP_NAME]发送用户[USER_NAME]发票提交完成',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
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

const OpenWeb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '新建窗口[DRIVER_NAME],打开网页[WEB_URL]',
    'zh-cn': '新建窗口[DRIVER_NAME],打开网页[WEB_URL]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebInput = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '在窗口[DRIVER_NAME]的[XPATH_VALUE]位置(XPATH)输入值[INPUT_VALUE]',
    'zh-cn': '在窗口[DRIVER_NAME]的[XPATH_VALUE]位置(XPATH)输入值[INPUT_VALUE]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WaitUntilXpath = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '循环等待[WAIT_TIME]秒,直到窗口[DRIVER_NAME]的[XPATH]位置(XPATH)出现元素',
    'zh-cn': '循环等待[WAIT_TIME]秒,直到窗口[DRIVER_NAME]的[XPATH]位置(XPATH)出现元素',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebWait = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '等待[WAIT_TIME]秒',
    'zh-cn': '等待[WAIT_TIME]秒',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const SwitchIframe = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '切换至窗口[DRIVER_NAME]的[XPATH_VALUE]iframe位置',
    'zh-cn': '切换至窗口[DRIVER_NAME]的[XPATH_VALUE]iframe位置',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const SwitchWindow = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '将浏览器[DRIVER_NAME]切换至新窗口',
    'zh-cn': '将浏览器[DRIVER_NAME]切换至新窗口',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebClick = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '点击窗口[DRIVER_NAME]的[XPATH_VALUE]位置(XPATH),之后等待[WAIT_TIME]秒',
    'zh-cn': '点击窗口[DRIVER_NAME]的[XPATH_VALUE]位置(XPATH),之后等待[WAIT_TIME]秒',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebGetValue = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '在窗口[DRIVER_NAME]中取[XPATH_VALUE]位置(XPATH)的值作为KEY[KEY_NAME]',
    'zh-cn': '在窗口[DRIVER_NAME]中取[XPATH_VALUE]位置(XPATH)的值作为KEY[KEY_NAME]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebValueReturn = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '在窗口[DRIVER_NAME]中取[XPATH_VALUE]位置(XPATH)的值',
    'zh-cn': '在窗口[DRIVER_NAME]中取[XPATH_VALUE]位置(XPATH)的值',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const WebPutValue = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '在窗口[DRIVER_NAME]中填入[XPATH_VALUE]位置(XPATH)的值为KEY[KEY_NAME]',
    'zh-cn': '在窗口[DRIVER_NAME]中填入[XPATH_VALUE]位置(XPATH)的值为KEY[KEY_NAME]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const InitOracleDb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '初始化Oracle数据库[DB_CODE](作识别标识),地址[DB_HOST],端口[DB_PORT],库名[DB_NAME],用户名[DB_USER],密码[DB_PASSWORD]',
    'zh-cn': '初始化Oracle数据库[DB_CODE](作识别标识),地址[DB_HOST],端口[DB_PORT],库名[DB_NAME],用户名[DB_USER],密码[DB_PASSWORD]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const InitMysqlDb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '初始化MySQL数据库[DB_CODE](作识别标识),地址[DB_HOST],端口[DB_PORT],库名[DB_NAME],用户名[DB_USER],密码[DB_PASSWORD]',
    'zh-cn': '初始化MySQL数据库[DB_CODE](作识别标识),地址[DB_HOST],端口[DB_PORT],库名[DB_NAME],用户名[DB_USER],密码[DB_PASSWORD]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const OracleWriteToDb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '数据写入Oracle数据库[DB_NAME]的表[TABLE_NAME]中,自增字段为[KEY_NAME]',
    'zh-cn': '数据写入Oracle数据库[DB_NAME]的表[TABLE_NAME]中,自增字段为[KEY_NAME]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const MysqlWriteToDb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '数据写入MySQL数据库[DB_NAME]的表[TABLE_NAME]中,自增字段为[KEY_NAME]',
    'zh-cn': '数据写入MySQL数据库[DB_NAME]的表[TABLE_NAME]中,自增字段为[KEY_NAME]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const RefreshWeb = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '刷新窗口[DRIVER_NAME]',
    'zh-cn': '刷新窗口[DRIVER_NAME]',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const ReadFileLine = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '读取文件[FILE_NAME]的第[LINE]行的值',
    'zh-cn': '读取文件[FILE_NAME]的第[LINE]行的值',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
};

const GetNowTime = {
    'pt-br': 'Definir Pino PWM[PIN]com[VALUE]%',
    'pt': 'Definir Pino PWM[PIN]com[VALUE]%',
    'en': 'Write PWM Pin [PIN] [VALUE]%',
    'fr': 'Mettre la pin PWM[PIN]à[VALUE]%',
    'zh-tw': '获取当前时间',
    'zh-cn': '获取当前时间',
    'pl': 'Ustaw PWM Pin [PIN] na [VALUE]%',
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
                // {
                //     opcode: 'ip_address',
                //     blockType: BlockType.COMMAND,
                //     //text: 'Write Digital Pin [PIN] [ON_OFF]',
                //     text: FormIPBlockR[the_locale],
                //
                //     arguments: {
                //         IP_ADDR: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '',
                //             //menu: "digital_sizes"
                //         },
                //
                //     }
                //
                // },

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
				// {
                //     opcode: 'write_txt',
                //     //blockType: BlockType.REPORTER,
				// 	blockType: BlockType.COMMAND,
                //     text: FormDigitalWrite[the_locale],
                //
				// 	arguments: {
                //         TXT_PATH: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //             //menu: 'digital_sizes'
                //         }
                //     }
                // },

                {
                    opcode: 'create_CSV',
                    blockType: BlockType.COMMAND,
                    text: CreateCSV[the_locale],

                    arguments: {
                        CSV_PATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                // {
                //     opcode: 'out_Put_Screen',
                //     blockType: BlockType.COMMAND,
                //     text: OutPutScreen[the_locale],
                //
                //     arguments: {
                //         PRINT_INFO: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         }
                //     }
                // },

                // {
                //     opcode: 'get_Now_Time',
                //     blockType: BlockType.COMMAND,
                //     text: GetNowTime[the_locale]
                // },

                {
                    opcode: 'read_File_Line',
                    blockType: BlockType.REPORTER,
                    text: ReadFileLine[the_locale],

                    arguments: {
                        FILE_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        LINE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'web_Wait',
                    blockType: BlockType.COMMAND,
                    text: WebWait[the_locale],

                    arguments: {
                        WAIT_TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                        }
                    }
                },

                '---',

                // {
                //     opcode: 'test_transmit',
                //     blockType: BlockType.REPORTER,
                //     text: FormTransWrite[the_locale],
                //
                //     arguments: {
                //         TRANS_NUM: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '',
                //             //menu: 'digital_sizes'
                //         }
                //     }
                // },

                {
                    opcode: 'formDistinguish_invoice',
                    blockType: BlockType.COMMAND,
                    text: FormDistinguishInvoice[the_locale],

                    arguments: {
                        IMAGE_PATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        CSV_PATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                // {
                //     opcode: 'open_CSV',
                //     blockType: BlockType.COMMAND,
                //     text: OpenCSV[the_locale],
                //
                //     arguments: {
                //         CSV_PATH: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         }
                //     }
                // },

                {
                    opcode: 'auto_Write',
                    blockType: BlockType.COMMAND,
                    text: AutoWrite[the_locale],

                    arguments: {
                        WEB_SITE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        USER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DEPARTMENT: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        CSV_PATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                // {
                //     opcode: 'show_Info',
                //     blockType: BlockType.COMMAND,
                //     text: ShowInfo[the_locale],
                //
                //     arguments: {
                //         IMAGE_PATH: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         },
                //         CSV_PATH: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         },
                //         TOTAL_PATH: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         }
                //     }
                // },

                {
                    opcode: 'send_Wechat',
                    blockType: BlockType.COMMAND,
                    text: SendWechat[the_locale],

                    arguments: {
                        GROUP_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        USER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },
                '---',
                {
                    opcode: 'init_Oracle_Db',
                    blockType: BlockType.COMMAND,
                    text: InitOracleDb[the_locale],

                    arguments: {
                        DB_CODE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_HOST: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_PORT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                        },
                        DB_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_USER: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_PASSWORD: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'init_Mysql_Db',
                    blockType: BlockType.COMMAND,
                    text: InitMysqlDb[the_locale],

                    arguments: {
                        DB_CODE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_HOST: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_PORT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                        },
                        DB_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_USER: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        DB_PASSWORD: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'oracle_Write_To_Db',
                    blockType: BlockType.COMMAND,
                    text: OracleWriteToDb[the_locale],

                    arguments: {
                        DB_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        TABLE_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        KEY_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'mysql_Write_To_Db',
                    blockType: BlockType.COMMAND,
                    text: MysqlWriteToDb[the_locale],

                    arguments: {
                        DB_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        TABLE_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        KEY_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },
                '---',
                {
                    opcode: 'open_Web',
                    blockType: BlockType.COMMAND,
                    text: OpenWeb[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        WEB_URL: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'web_Input',
                    blockType: BlockType.COMMAND,
                    text: WebInput[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        INPUT_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'wait_Until_Xpath',
                    blockType: BlockType.COMMAND,
                    text: WaitUntilXpath[the_locale],

                    arguments: {
                        WAIT_TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5,
                        },
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'switch_Iframe',
                    blockType: BlockType.COMMAND,
                    text: SwitchIframe[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'switch_Window',
                    blockType: BlockType.COMMAND,
                    text: SwitchWindow[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'web_Click',
                    blockType: BlockType.COMMAND,
                    text: WebClick[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        WAIT_TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'web_GetValue',
                    blockType: BlockType.COMMAND,
                    text: WebGetValue[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        KEY_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                // {
                //     opcode: 'web_Value_Return',
                //     blockType: BlockType.REPORTER,
                //     text: WebValueReturn[the_locale],
                //
                //     arguments: {
                //         DRIVER_NAME: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         },
                //         XPATH_VALUE: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '',
                //         }
                //     }
                // },

                {
                    opcode: 'web_PutValue',
                    blockType: BlockType.COMMAND,
                    text: WebPutValue[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        XPATH_VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        },
                        KEY_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                        }
                    }
                },

                {
                    opcode: 'refresh_Web',
                    blockType: BlockType.COMMAND,
                    text: RefreshWeb[the_locale],

                    arguments: {
                        DRIVER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
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
			msg = {"command": "write_txt", "txt_path": txt_path, "uuid": client_code};
			msg = JSON.stringify(msg);
			window.socketr.send(msg);
            //return digital_inputs[sonar_report_pin];

        }
    }

    out_Put_Screen(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.out_Put_Screen.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let print_info = args['PRINT_INFO'];
            msg = {"command": "out_Put_Screen", "print_info": print_info, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];

        }
    }

    test_transmit(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.test_transmit.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let trans_num = args['TRANS_NUM'];
            msg = {"command": "test_transmit", "trans_num": trans_num, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);

            return digital_inputs[sonar_report_pin];

        }
    }

    formDistinguish_invoice(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.formDistinguish_invoice.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let csv_path = args['CSV_PATH'];
            let image_path = args['IMAGE_PATH'];
            msg = {"command": "formDistinguish_invoice", "csv_path": csv_path, "image_path":image_path, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    create_CSV(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.create_CSV.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let csv_path = args['CSV_PATH'];
            msg = {"command": "create_CSV", "csv_path": csv_path, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    auto_Write(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.auto_Write.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let web_site = args['WEB_SITE'];
            let user_name = args['USER_NAME'];
            let department = args['DEPARTMENT'];
            let csv_path = args['CSV_PATH'];
            msg = {"command": "auto_Write", "web_site": web_site,"user_name": user_name,"department": department, "csv_path": csv_path, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    send_Wechat(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.send_Wechat.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let group_name = args['GROUP_NAME'];
            let user_name = args['USER_NAME'];
            msg = {"command": "send_Wechat", "group_name": group_name, "user_name": user_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    open_Web(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.open_Web.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let web_url = args['WEB_URL'];

            msg = {"command": "open_Web", "driver_name": driver_name, "web_url": web_url, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_Input(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_Input.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];
            let input_value = args['INPUT_VALUE'];

            msg = {"command": "web_Input", "driver_name": driver_name, "xpath_value": xpath_value, "input_value": input_value, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    wait_Until_Xpath(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.wait_Until_Xpath.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let wait_time = args['WAIT_TIME'];
            let driver_name = args['DRIVER_NAME'];
            let xpath = args['XPATH'];

            msg = {"command": "wait_Until_Xpath", "wait_time": wait_time, "driver_name": driver_name, "xpath": xpath, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_Wait(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_Wait.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let wait_time = args['WAIT_TIME'];

            msg = {"command": "web_Wait", "wait_time": wait_time, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    switch_Iframe(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.switch_Iframe.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];

            msg = {"command": "switch_Iframe", "driver_name": driver_name, "xpath_value": xpath_value, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    switch_Window(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.switch_Window.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];

            msg = {"command": "switch_Window", "driver_name": driver_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_Click(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_Click.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];
            let wait_time = args['WAIT_TIME'];

            msg = {"command": "web_Click", "driver_name": driver_name, "xpath_value": xpath_value, "wait_time": wait_time, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_Value_Return(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_Value_Return.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];

            msg = {"command": "web_Value_Return", "driver_name": driver_name, "xpath_value": xpath_value, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_GetValue(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_GetValue.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];
            let key_name = args['KEY_NAME'];

            msg = {"command": "web_GetValue", "driver_name": driver_name, "xpath_value": xpath_value, "key_name": key_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    web_PutValue(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.web_PutValue.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];
            let xpath_value = args['XPATH_VALUE'];
            let key_name = args['KEY_NAME'];

            msg = {"command": "web_PutValue", "driver_name": driver_name, "xpath_value": xpath_value, "key_name": key_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    init_Oracle_Db(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.init_Oracle_Db.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let db_code = args['DB_CODE'];
            let db_host = args['DB_HOST'];
            let db_port = args['DB_PORT'];
            let db_name = args['DB_NAME'];
            let db_user = args['DB_USER'];
            let db_password = args['DB_PASSWORD'];

            msg = {"command": "init_Oracle_Db", "db_code": db_code, "db_host": db_host, "db_port": db_port,
                "db_name": db_name, "db_user": db_user, "db_password": db_password, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    init_Mysql_Db(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.init_Mysql_Db.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let db_code = args['DB_CODE'];
            let db_host = args['DB_HOST'];
            let db_port = args['DB_PORT'];
            let db_name = args['DB_NAME'];
            let db_user = args['DB_USER'];
            let db_password = args['DB_PASSWORD'];

            msg = {"command": "init_Mysql_Db", "db_code": db_code, "db_host": db_host, "db_port": db_port,
                "db_name": db_name, "db_user": db_user, "db_password": db_password, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    oracle_Write_To_Db(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.oracle_Write_To_Db.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let db_name = args['DB_NAME'];
            let table_name = args['TABLE_NAME'];
            let key_name = args['KEY_NAME'];
            msg = {"command": "oracle_Write_To_Db", "db_name": db_name, "table_name": table_name, "key_name": key_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    mysql_Write_To_Db(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.mysql_Write_To_Db.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let db_name = args['DB_NAME'];
            let table_name = args['TABLE_NAME'];
            let key_name = args['KEY_NAME'];
            msg = {"command": "mysql_Write_To_Db", "db_name": db_name, "table_name": table_name, "key_name": key_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    refresh_Web(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.refresh_Web.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let driver_name = args['DRIVER_NAME'];

            msg = {"command": "refresh_Web", "driver_name": driver_name, "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
        }
    }

    read_File_Line(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.read_File_Line.bind(this), args];
            wait_open.push(callbackEntry);
        } else {
            let file_name = args['FILE_NAME'];
            let line = args['LINE'];

            data = {"command": "read_File_Line", "file_name": file_name, "line": line, "uuid": client_code};

            data = JSON.stringify(data);
            window.socketr.send(data);

            return new Promise((resolve) => {
				window.socketr.onmessage = (ev) => {
					console.log("data: "+ev.data)
					msg = JSON.parse(ev.data)
					value = msg['value']
					digital_inputs[sonar_report_pin] = value
					console.log("get value: "+digital_inputs[sonar_report_pin])
					resolve()
				};
			}).then(() => { 
				console.log("return: "+digital_inputs[sonar_report_pin])
				return digital_inputs[sonar_report_pin]
			});
		
			// return digital_inputs[sonar_report_pin]
        }
    }


    get_Now_Time(args) {
        if (!connected) {
            if (!connection_pending) {
                this.connect();
                connection_pending = true;
            }
        }
        if (!connected) {
            let callbackEntry = [this.get_Now_Time.bind(this), args];
            wait_open.push(callbackEntry);
        } else {

            msg = {"command": "get_Now_Time", "uuid": client_code};
            msg = JSON.stringify(msg);
            window.socketr.send(msg);
            return digital_inputs[sonar_report_pin];
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
			msg = {"command": "draw_circle", "radius_size": radius_size, "line_color": line_color, "uuid": client_code};
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
            client_code = this.generateUUID();
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

    generateUUID() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }


}

module.exports = Scratch3NlOneGPIO;
