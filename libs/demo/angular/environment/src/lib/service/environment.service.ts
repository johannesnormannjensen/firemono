import { Environment } from '../model/environment.model';

export class EnvironmentService {

    #environment: Environment;

    constructor(environment: Environment) {
        this.#environment = environment;
    }

    get environment(): Environment {
        return this.#environment;
    }

    get apiUrl(): string {
        return this.#environment.apiUrl;
    }

    get environmentType() {
        return this.#environment.type;
    }
}