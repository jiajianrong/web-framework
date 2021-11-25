import 'reflect-metadata';
//const http = require('http');
const Koa = require('koa');
const app = new Koa();

const CONTROLLER_METADATA = 'controller';
//const ROUTE_METADATA = 'method';

function firstParamCheck(name: string): MethodDecorator {
	return (target: Object, key: string, descriptor: PropertyDescriptor) => {
        let originMethed = descriptor.value;
        let paramtypes = Reflect.getMetadata('design:paramtypes', target, key);

        console.log(paramtypes[0].name, typeof paramtypes[0]);

        // return (...args) => {
        //     console.log('new')
        // }

        descriptor.value = function (firstParam) {
            console.log(1, name);
            console.log(firstParam);
            let supposedType = paramtypes[0].name.toLowerCase();
            if (typeof firstParam !== supposedType) {
                console.log('!!!notmatch:', typeof firstParam, supposedType);
                firstParam = Number(firstParam);
                console.log('!!!match:', typeof firstParam, supposedType);
            }
            const res = originMethed.apply(this, [firstParam]);
            console.log(3, name);
            return res;
        }

        return descriptor;
	}
}

function Controller(path: string): ClassDecorator {
    return target => {
        Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
    }
}

@Controller('/test')
class TestController {
    @firstParamCheck('/say')
    say(score: number) {
        console.log('test.say() ' + score);
    }
}


// @Controller('/another')
// class AnotherController {
//     @Get('/run')
//     run() {
//         console.log('another.run()');
//     }
// }

let age: any = '99';
let main = new TestController()
main.say(age);
main.say(100);
//main.say();



app.use(async function(ctx, next) {	
    console.log('hello');
    ctx.body = 'hello';
});

//app.listen(9999);