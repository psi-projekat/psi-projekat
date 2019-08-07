'use strict';

const PL = require('/node/prog-langs/programming-language');
const ProgLangEngine = require('/node/prog-langs/engine');
const RenderEngine = require('/node/simulator/render-engine');
const execute = require('/node/simulator/execute');
const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const TextEditor = require('../text-editor');
const Form = require('../form');
const Frame = require('../frame');
const elemCtors = require('../sandbox');
const Page = require('./page');

const SCRIPT_IDENTIFIER = 'ai-playground.user-script';
const SCRIPT_VERSION = 1;

const WIDTH = 926;
const HEIGHT = 671;

const DEFAULT_TAB = 'script';

class Sandbox extends Page{
  constructor(parent){
    super(parent);

    this.running = 0;
    this.awaitingPause = 0;
    this.disposed = 0;

    const {dom} = O.glob;

    const labs = LS.labels.sandbox;
    const frame = this.frame = new Frame(this, [
      ['script', labs.script],
      ['input', labs.input],
      ['output', labs.output],
      ['simulator', labs.simulator],
      ['settings', labs.settings],
    ]);

    const editors = this.editors = O.obj();

    for(let i = 0; i !== 3; i++){
      const tab = frame.tabs[i];
      const {name} = tab;

      const content = frame.contents[i];
      const editor = editors[name] = new TextEditor(content);

      if(name === 'output')
        editor.disable();
    }

    const canvCont = new elemCtors.CanvasContainer(frame.contents[3].elem);
    const reng = this.reng = new RenderEngine(canvCont.elem, WIDTH, HEIGHT);
    reng.init()//.catch(log);

    const settings = this.settings = new elemCtors.Configuration(frame.contents[4]);
    let doNotEval = 0;

    settings.on('exportScript', () => {
      (async () => {
        const ser = new O.Serializer();

        ser.writeStr(SCRIPT_IDENTIFIER);
        ser.writeUint(SCRIPT_VERSION);

        const lang = await settings.getLang();
        ser.writeStr(lang.name);
        ser.writeStr(editors.script.val);

        const buf = ser.getOutput(1);
        const str = buf.toString('base64');
        const token = await backend.echo(str);

        const a = O.doc.createElement('a');
        a.href = `/echo?token=${token}`;

        a.download = `${
          O.lst.signedIn ? `${O.lst.nick}-` : ''
        }${O.now}.user-script`;

        a.click();
      })()//.catch(log);
    });

    frame.on('select', tab => {
      if(this.disposed) return;

      const {script, input, output} = this.editors;
      const {name} = tab;

      const out = name === 'output';
      const sim = name === 'simulator';

      if(out && doNotEval){
        doNotEval = 0;
        return;
      }

      if(out || sim){
        (async () => {
          await O.await(() => this.disposed || !this.running);
          if(this.disposed) return;
          this.running = 1;

          const maxSize = settings.get('maxSize');
          const criticalSize = settings.get('criticalSize');
          const instructionsPerTick = settings.get('instructionsPerTick');

          output.val = 'Computing...';
          output.elem.classList.remove('output-error');
          output.elem.classList.add('output-computing');

          reng.play();

          const lang = await this.settings.getLang();
          if(this.disposed) return;

          const eng = this.eng = new ProgLangEngine(lang, script.val, maxSize, criticalSize);
          let error = null;
          let io;

          if(out){
            io = new O.IO(input.val);

            eng.stdin.on('read', (buf, len) => {
              buf[0] = io.read();
              return io.hasMore;
            });

            eng.stdout.on('write', (buf, len) => {
              io.write(buf[0]);
            });

            eng.stderr.on('write', (buf, len) => {
              error = buf.toString();
              eng.pause();
            });

            await O.await(async () => {
              if(this.disposed || this.awaitingPause || error !== null) return 1;
              eng.run(instructionsPerTick);
              return eng.done;
            });
          }else{
            const inp = [];
            const out = [];

            eng.stdin.on('read', (buf, len) => {
              if(len & 7)
                throw dom.alert('Input bit stream is currently not supported in simulator');

              len >>= 3;

              for(let i = 0; i !== len; i++){
                if(out.length !== 0) buf[i] = out.shift();
                else buf[i] = 0;
              }

              return 1;
            });

            eng.stdout.on('write', (buf, len) => {
              if(len & 7)
                throw dom.alert('Output bit stream is currently not supported in simulator');

              len >>= 3;

              for(let i = 0; i !== len; i++)
                inp.push(buf[i]);

              eng.pause();
            });

            eng.stderr.on('write', (buf, len) => {
              error = buf.toString();
              eng.pause();
            });

            let botObj = null;

            const onTick = bot => {
              if(botObj === null){
                botObj = bot;
              }else if(bot !== botObj){
                bot.remove();
                dom.err('multipleBotsInSandbox');
                return;
              }

              let ticks = instructionsPerTick;

              while(ticks > 0){
                const prev = ticks;
                ticks = execute(bot, inp, out, ticks);
                if(ticks === prev) break;
              }

              while(ticks > 0 && !eng.done){
                ticks = eng.run(ticks);
                if(error !== null) break;

                while(ticks > 0){
                  const prev = ticks;
                  ticks = execute(bot, inp, out, ticks);
                  if(ticks === prev) break;
                }
              }
            };

            reng.on('tick', onTick);

            await O.await(async () => {
              if(this.disposed || this.awaitingPause || error !== null) return 1;
              return eng.done;
            }, 1e3);

            reng.rel('tick', onTick);
          }

          if(this.disposed) return;
          this.running = 0;
          this.awaitingPause = 0;
          output.elem.classList.remove('output-computing');

          if(error !== null){
            output.val = error;
            output.elem.classList.add('output-error');

            if(sim){
              doNotEval = 1;
              frame.selectTab('output');
            }

            return;
          }

          if(out)
            output.val = io.getOutput().toString();
        })()//.catch(log);

        return;
      }
    });

    frame.on('unselect', tab => {
      const {name} = tab;

      const out = name === 'output';
      const sim = name === 'simulator';

      if(out || sim){
        this.awaitingPause = this.running;
        if(sim) reng.pause();
      }
    });

    const onKeyDown = evt => {
      if(this.disposed || !evt.ctrlKey) return;

      const matchDigit = evt.code.match(/^(?:Digit|Numpad)([12345])$/);
      if(matchDigit !== null){
        O.pd(evt);

        const digit = ~-matchDigit[1];
        frame.selectTabByIndex(digit);
      }
    };

    O.ael('keydown', onKeyDown);

    this.on('remove', () => {
      this.disposed = 1;

      O.rel('keydown', onKeyDown);
      reng.dispose();
    });

    editors.script.val = LS.texts.scriptTemplate;

    frame.selectTab(DEFAULT_TAB);
  }

  static title(){ return LS.titles.sandbox; }

  css(){ return 'sandbox'; }
}

module.exports = Sandbox;