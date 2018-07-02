import { IEnvironment } from '../../Environment/IEnvironment';
import { MessageSender } from '../MessageSender';
import { TestFrameworkFactory } from '../TestFrameworks/TestFrameworkFactory';
import { IEvent, IEventArgs } from '../../ObjectModel/Common';
import { TestFrameworkEventHandlers } from '../TestFrameworks/TestFrameworkEventHandlers';
import { TestSessionManager } from './TestSessionManager';
import { TestFrameworks, ITestFramework } from '../../ObjectModel/TestFramework';
import { Exception, ExceptionType } from '../../Exceptions';

export abstract class BaseExecutionManager {
    protected readonly environment: IEnvironment;
    protected readonly messageSender: MessageSender;
    protected readonly testFrameworkFactory: TestFrameworkFactory;
    protected readonly onComplete: IEvent<IEventArgs>;
    protected readonly testSessionManager: TestSessionManager;

    protected abstract testFrameworkEventHandlers: TestFrameworkEventHandlers;

    constructor(environment: IEnvironment, messageSender: MessageSender, testFramework: TestFrameworks) {
        this.environment = environment;
        this.messageSender = messageSender;
        this.onComplete = environment.createEvent();
        this.testFrameworkFactory = TestFrameworkFactory.instance;
        this.testSessionManager = TestSessionManager.instance;
    }

    protected getCompletionPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.onComplete.subscribe((sender: object, args: IEventArgs) => {
                resolve();
            });
        });
    }

    protected getSourcesFromAdapterSourceMap(adapterSourceMap: { [key: string]: string[]; }): Array<string> {
        const keys = Object.keys(adapterSourceMap);
        let sourceList = [];

        keys.forEach(key => {
            sourceList = sourceList.concat(adapterSourceMap[key]);
        });

        return sourceList;
    }

    protected createTestFramework(framework: TestFrameworks): ITestFramework {
        const testFrameworkInstance = this.testFrameworkFactory.createTestFramework(framework);
        try {
            testFrameworkInstance.initialize();
        } catch (e) {
            // log e
            throw new Exception('Error initializing test framework.', ExceptionType.TestFrameworkError);
        }
        this.testFrameworkEventHandlers.Subscribe(testFrameworkInstance);
        return testFrameworkInstance;
    }
}