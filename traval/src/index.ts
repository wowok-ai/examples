
import { sleep } from './common'
import { Account } from 'wowok_agent';

const main = async () => {

    if (!await Account.Instance().get_address()) {
        await Account.Instance().gen('my default account', true);
        await Account.Instance().faucet();
        await sleep(2000);
        console.log('Gen account: '+await Account.Instance().get_address());
        console.log('Test related functions, please make sure that the account contains SUI test coins');
    }

    
}  

main().catch(console.error)