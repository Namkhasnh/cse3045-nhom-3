// Test-only independent backend process; never uses retained DATABASE_URL.
import {Test} from '@nestjs/testing';
import {AppModule} from '../src/app.module.js';
import {PrismaService} from '../src/prisma/prisma.service.js';
import {configureApiHttp} from '../src/common/http/api-http.js';
const target=new URL(process.env.TEST_DATABASE_URL!);
if(process.env.TEST_ORDER_RACE_WORKER!=='true'||!['127.0.0.1','localhost'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1)))throw new Error('Disposable worker target required');
const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_RUNTIME_DATABASE_URL??process.env.TEST_DATABASE_URL)).compile();
const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');process.send?.({origin:await app.getUrl(),pid:process.pid});
const stop=()=>{void app.close().then(()=>process.exit(0))};process.on('message',stop);process.once('SIGTERM',stop);
