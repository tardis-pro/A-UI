export interface NotificationEvent {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    payload: any;
}

export interface CodeCompletionEvent extends NotificationEvent {
    type: 'code_completion';
    payload: {
        code: string;
        message: string;
    };
}