import {
    getSecrets,
    initialize,
    initializeStorage,
    KeyValueStorage
} from '../src/keeper';
import {nodePlatform} from '../src/node/nodePlatform';
import {connectPlatform} from '../src/platform';
import * as fs from 'fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

connectPlatform(nodePlatform)
initialize()

const configFileName = 'client-config.json'
const bindingKey = 'K95axR5yF2QBXRauVVVgeEi7BocHxqPJYUk9dJj0t_4'

async function test() {
    const kvs = new TestKeyValueStorage()
    await initializeStorage(kvs, bindingKey, 'local.keepersecurity.com')
    const response = await getSecrets(kvs)
    console.log(response)
}

export class TestKeyValueStorage implements KeyValueStorage {

    readStorage(): any {
        try {
            return  JSON.parse(fs.readFileSync(configFileName).toString())
        }
        catch (e) {
            return {}
        }
    }

    saveStorage(storage: any) {
        fs.writeFileSync(configFileName, JSON.stringify(storage, null, 2))
    }

    getValue(key: string): Promise<string | undefined> {
        const storage = this.readStorage()
        const keyParts = key.split('/')
        let obj = storage
        for (const part of keyParts) {
            obj = obj[part]
            if (!obj) {
                return Promise.resolve(undefined)
            }
        }
        return Promise.resolve(obj.toString());
    }

    saveValue(key: string, value: string): Promise<void> {
        const storage = this.readStorage()
        const keyParts = key.split('/')
        let obj = storage
        for (const part of keyParts.slice(0, -1)) {
            if (!obj[part]) {
                obj[part] = {}
            }
            obj = obj[part]
        }
        obj[keyParts.slice(-1)[0]] = value
        this.saveStorage(storage)
        return Promise.resolve()
    }

    clearValues(keys: string[]): Promise<void> {
        const storage = this.readStorage()
        for (const key of keys) {
            const keyParts = key.split('/')
            let obj = storage
            for (const part of keyParts.slice(0, -1)) {
                if (!obj[part]) {
                    obj[part] = {}
                }
                obj = obj[part]
            }
            delete obj[keyParts.slice(-1)[0]]
        }
        this.saveStorage(storage)
        return Promise.resolve()
    }
}

test().finally()