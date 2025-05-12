import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mark from 'mark.js';

interface CodeSearchResultProps {
    code: string;
    language: string;
    analysis?: string;
    searchQuery?: string;
}

const CodeSearchResult: React.FC<CodeSearchResultProps> = ({ code, language, analysis, searchQuery }) => {
    const highlighterRef = useRef<HTMLElement>(null);
    const [currentMarkedIndex, setCurrentMarkedIndex] = React.useState(0);

    useEffect(() => {
        // @ts-ignore
        const node = ReactDOM.findDOMNode(highlighterRef.current) as HTMLElement;

        if (node && searchQuery) {
            const markInstance = new Mark(node);
            markInstance.mark(searchQuery);
            setCurrentMarkedIndex(0);
        }

        return () => {
            // @ts-ignore
            const node = ReactDOM.findDOMNode(highlighterRef.current) as HTMLElement;
            if (node) {
                const markInstance = new Mark(node);
                markInstance.unmark();
            }
        };
    }, [searchQuery]);

    const handlePrevious = () => {
        const node = ReactDOM.findDOMNode(highlighterRef.current) as HTMLElement;
        if (node) {
            const markedElements = node.querySelectorAll('mark');
            if (markedElements.length > 0) {
                let newIndex = currentMarkedIndex - 1;
                if (newIndex < 0) {
                    newIndex = markedElements.length - 1;
                }
                const element = markedElements[newIndex] as HTMLElement;
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });
                setCurrentMarkedIndex(newIndex);
                console.log('Previous clicked');
            }
        }
    };

    const handleNext = () => {
        const node = ReactDOM.findDOMNode(highlighterRef.current) as HTMLElement;
        if (node) {
            const markedElements = node.querySelectorAll('mark');
            if (markedElements.length > 0) {
                let newIndex = currentMarkedIndex + 1;
                if (newIndex >= markedElements.length) {
                    newIndex = 0;
                }
                const element = markedElements[newIndex] as HTMLElement;
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });
                setCurrentMarkedIndex(newIndex);
                console.log('Next clicked');
            }
        }
    };

    return (
        <div>
            <SyntaxHighlighter language={language} style={dracula}>
                {code}
            </SyntaxHighlighter>
            {analysis && (
                <div>
                    <strong>Analysis:</strong>
                    <p>{analysis}</p>
                </div>
            )}
            <div>
                <button onClick={handlePrevious}>Previous</button>
                <button onClick={handleNext}>Next</button>
            </div>
            <div>
                <strong>Semantic Relationships:</strong>
                {/* TODO: Implement semantic relationship visualization */}
            </div>
        </div>
    );
};

export default CodeSearchResult;