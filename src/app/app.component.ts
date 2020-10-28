import { Component } from '@angular/core';
import { interval, fromEvent, combineLatest, BehaviorSubject } from 'rxjs';
import { scan, startWith, map, takeWhile, switchMap } from 'rxjs/operators';
import { State, Letter, Letters } from './interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'alphabet-invasion';
  private levelChangeThreshold = 20;
  private speedAdjust = 50;
  private endThreshold = 15;
  private gameWidth = 30;
  private intervalSubject = new BehaviorSubject(600);

  ngOnInit() {
    this.game$.subscribe(
      this.renderGame,
      this.noop,
      this.renderGameOver
    );
  }
  randomLetter () {
    return String.fromCharCode( Math.random() * ('z'.charCodeAt(0) - 'a'.charCodeAt(0)) + 'a'.charCodeAt(0));
  }

  letters$ = this.intervalSubject.pipe(
    switchMap(i => interval(i)
      .pipe(
        scan<number, Letters>((letters) => ({
          intrvl: i,
          ltrs: [({
            letter: this.randomLetter(),
            yPos: Math.floor(Math.random() * this.gameWidth)
          }), ...letters.ltrs]
        }), { ltrs: [], intrvl: 0 })
  )));
  

  keys$ = fromEvent(document, 'keydown')
  .pipe(
    startWith({ key: '' }),
    map((e: KeyboardEvent) => e.key)
  );

  renderGame = (state: State) => (
    document.body.innerHTML = `Score: ${state.score}, Level: ${state.level} <br/>`,
    state.letters.forEach(l => document.body.innerHTML +=
      '&nbsp'.repeat(l.yPos) + l.letter + '<br/>'),
    document.body.innerHTML +=
    '<br/>'.repeat(this.endThreshold - state.letters.length - 1) + '-'.repeat(this.gameWidth)
  );

  renderGameOver = () => document.body.innerHTML += '<br/>GAME OVER! <button (click)="restart()">Restart</button>';

  noop = () => { };

  game$ = combineLatest([this.keys$, this.letters$]).pipe(
    scan<[string, Letters], State>((state, [key, letters]) => (
      letters.ltrs[letters.ltrs.length - 1]
        && letters.ltrs[letters.ltrs.length - 1].letter === key
        ? (state.score = state.score + 1, letters.ltrs.pop())
        : this.noop(),
      state.score > 0 && state.score % this.levelChangeThreshold === 0
        ? (
          letters.ltrs = [],
          state.level = state.level + 1,
          state.score = state.score + 1,
          this.intervalSubject.next(letters.intrvl - this.speedAdjust))
        : this.noop(),
      ({ score: state.score, letters: letters.ltrs, level: state.level })),
      { score: 0, letters: [], level: 1 }),
    takeWhile(state => state.letters.length < this.endThreshold),
  );
}
