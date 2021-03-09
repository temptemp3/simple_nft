import React from 'react';
import AppViews from './views/AppViews';
import DeployerViews from './views/DeployerViews';
import AttacherViews from './views/AttacherViews';
import { renderDOM, renderView } from './views/render';

import * as backend from './build/index.main.mjs';
import * as reach from '@reach-sh/stdlib/ALGO';

const { standardUnit } = reach;
const defaults = { defaultFundAmt: '10', defaultWager: '3', standardUnit };

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { view: 'ConnectAccount', ...defaults };
    }
    async componentDidMount() {
        const acc = await reach.getDefaultAccount();
        const balAtomic = await reach.balanceOf(acc);
        const bal = reach.formatCurrency(balAtomic, 4);
        this.setState({ acc, bal });
        try {
            const faucet = await reach.getFaucet();
            this.setState({ view: 'FundAccount', faucet });
        } catch (e) {
            this.setState({ view: 'DeployerOrAttacher' });
        }
    }
    async fundAccount(fundAmount) {
        await reach.transfer(this.state.faucet, this.state.acc, reach.parseCurrency(fundAmount));
        this.setState({ view: 'DeployerOrAttacher' });
    }
    async skipFundAccount() { this.setState({ view: 'DeployerOrAttacher' }); }
    selectAttacher() { this.setState({ view: 'Wrapper', ContentView: Attacher }); }
    selectDeployer() { this.setState({ view: 'Wrapper', ContentView: Deployer }); }
    render() { return renderView(this, AppViews); }
}


class Deployer {
    constructor(props) {
        super(props);
        this.state = { view: 'SetWager' };
    }
    setWager(wager) { this.setState({ view: 'Deploy', wager }); }
    async deploy() {
        const ctc = this.props.acc.deploy(backend);
        this.setState({ view: 'Deploying', ctc });
        this.wager = reach.parseCurrency(this.state.wager); // UInt
        backend.Alice(ctc, this);
        const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
        this.setState({ view: 'WaitingForAttacher', ctcInfoStr });
    }


    render() { return renderView(this, DeployerViews); }
}

class Attacher {
    constructor(props) {
        super(props);
        this.state = { view: 'Attach' };
    }
    attach(ctcInfoStr) {
        const ctc = this.props.acc.attach(backend, JSON.parse(ctcInfoStr));
        this.setState({ view: 'Attaching' });
        backend.Bob(ctc, this);
    }

    render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);
