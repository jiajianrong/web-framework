import 'reflect-metadata';
//const http = require('http');
const Koa = require('koa');
const app = new Koa();

function traceAround(name: string): MethodDecorator {
	return (target: Object, key: string, descriptor: PropertyDescriptor) => {
        // console.log(1,target);
        // console.log(2,key);
        // console.log(3,descriptor);

        let func = descriptor.value;

        descriptor.value = function (...args) {
            console.log(1, name);
            const res = func.apply(this, args);
            console.log(3, name);
            return res;
        }

        return descriptor;
	}
}


class Main {
    @traceAround('around')
    say() {
        console.log('main');
    }
}

let main = new Main()
main.say();
main.say();
//main.say();



app.use(async function(ctx, next) {	
    console.log('hello');
    ctx.body = 'hello';
});

//app.listen(9999);