import { TestBed } from '@angular/core/testing';

import { FAKE_HOME_OPTIONS, FakeHomeScenario } from '../../home/data/fake-home.source';
import { FakeSteamSource } from './fake-steam.source';
import { NOT_CONNECTED } from './steam.source';

function setup(scenario: FakeHomeScenario): FakeSteamSource {
  TestBed.configureTestingModule({
    providers: [
      FakeSteamSource,
      {
        provide: FAKE_HOME_OPTIONS,
        useValue: {
          scenario,
          loadDelayMs: 0,
          slowDelayMs: 0,
          actionDelayMs: 0,
          now: () => new Date(),
        },
      },
    ],
  });
  return TestBed.inject(FakeSteamSource);
}

describe('FakeSteamSource', () => {
  it('no primeiro acesso, começa sem Steam e conecta', async () => {
    const source = setup('first-access');
    expect(await source.account()).toEqual(NOT_CONNECTED);
    expect(await source.connect()).toBe('connected');
    expect((await source.account()).visibility).toBe('public');
  });

  it('com a Steam privada, "Já deixei público" deixa pública', async () => {
    const source = setup('steam-private');
    expect((await source.account()).visibility).toBe('private');
    expect(await source.recheck()).toBe('public');
    expect((await source.account()).visibility).toBe('public');
  });

  it('nos outros cenários, começa conectada e pública', async () => {
    expect(await setup('full').account()).toMatchObject({ connected: true, visibility: 'public' });
  });
});
