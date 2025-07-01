

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Testor {
    address: string;
    privkey: string;
}

export const TESTOR:Testor[] = [
    {
        address: '0xdde0847449b6ed54405053584779ab7c3a29257a5c1a88bb0b16588c67de401f',
        privkey: 'suiprivkey1qqdk8ggur2tzmddqe6nddc8msy94mhsxa5rtv9wdlew5zjk5ca5nkql0p6a'
    },
    {
        address: '0xa4ec7eb950179f1a051c8cd1fb03d4a0643688a2f4212010cc668fc356cc7066',
        privkey: 'suiprivkey1qzfjx4chrvpupu6p68nwqs4wst90872d85l859ulsmn2wca04agvkv0z4af'
    },
    {
        address: '0xf274de5e6a9b5ff0f55816be540d2f6f1b0c207c9f958431a32891313e28f3c6',
        privkey: 'suiprivkey1qz99tzqzat92eak92sture939uzjpvrjnw6lvh9prjwdvx7quvmyja9vjvw'
    },
    {
        address: '0xf7f03a75b8c7326de43808154d1f8b0a1a65aa8fbad56ca0c1119ccb1f256718',
        privkey: 'suiprivkey1qqxskkrdf3vdkzqqz96g3n9398lmda98lg5knxwxyuh6tsssyx5usz8z0v7'
    },
    {
        address: '0x06aab352bac7013d2c7fdeb3b05cc81579c78681a4d18c640957112c288d51ba',
        privkey: 'suiprivkey1qrfttf6udc7xuckpmx9qnhjhfluqzyqjlumzz67wgmkjg7k0edsdwkr0cj3'
    },
    {
        address: '0x4d1c0376ec5f384cc5ec4e60a1f13815d1f81c67ca49b4dcb8eaf85c6274887a',
        privkey: 'suiprivkey1qqxn0mcgyvxap366x7qygn0qhk9w92us4ayhzacm5czrm6rpwjvuzfuw4r7'
    },
    {
        address: '0xb1b7071f330fb98a5f5d650280dde55274cb2c516af479c92d643adae037a51f',
        privkey: 'suiprivkey1qqndq847xswpndmw7naq7aadzjl45h5c5355pqmqqpmu9dc435ynxd3vm5v'
    },
    {
        address: '0xbb0fbbb2b1df582b93e991af43b776a4c588d48cb055645c631151e013663264',
        privkey: 'suiprivkey1qp8s2n5l64uudwnus3m3jt738jyh3dyhxprdr7fhl9r8rmtzyd87uhdv59x'
    }
  ];
