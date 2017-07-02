
import { observable, action } from 'mobx';

class Home {
    @observable sessions = [];

    @action getSessions() {

    }
}

const self = new Home();
export default self;
