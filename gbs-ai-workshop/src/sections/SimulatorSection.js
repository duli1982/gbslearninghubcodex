import { ScenarioSimulator } from '../components/ScenarioSimulator.js';
import { loadScenarios } from '../data/loaders.js';

let simulator;

export async function initSimulatorSection() {
    if (!simulator) {
        simulator = new ScenarioSimulator({
            containerId: 'simulator-container',
            loadScenarios
        });
    }

    await simulator.init();
}
