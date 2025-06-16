import { useEffect, useState } from 'react';

export default function JiraIssuePanel() {
  const [issueData, setIssueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.AP) {
      window.AP.require('jira', (jira) => {
        const urlParams = new URLSearchParams(window.location.search);
        const issueKey = urlParams.get('issueKey');
        
        if (issueKey) {
          // Fetch issue data using Jira REST API
          jira.request({
            url: `/rest/api/3/issue/${issueKey}`,
            success: (data) => {
              setIssueData(JSON.parse(data));
              setLoading(false);
            },
            error: (error) => {
              console.error('Failed to fetch issue:', error);
              setLoading(false);
            }
          });
        }
      });
    }
  }, []);

  if (loading) {
    return <div>Loading issue data...</div>;
  }

  if (!issueData) {
    return <div>No issue data available</div>;
  }

  return (
    <div className="jira-issue-panel">
      <h3>PO Assistant</h3>
      <div className="issue-info">
        <h4>{issueData.fields.summary}</h4>
        <p><strong>Status:</strong> {issueData.fields.status.name}</p>
        <p><strong>Type:</strong> {issueData.fields.issuetype.name}</p>
        <p><strong>Priority:</strong> {issueData.fields.priority?.name || 'None'}</p>
      </div>
      
      {/* Your PO Assist functionality here */}
      <div className="po-assist-actions">
        <button onClick={() => analyzeIssue(issueData)}>
          Analyze Story
        </button>
        <button onClick={() => suggestAcceptanceCriteria(issueData)}>
          Suggest Acceptance Criteria
        </button>
      </div>
    </div>
  );
}

function analyzeIssue(issue) {
  // Your existing PO analysis logic
  console.log('Analyzing issue:', issue.key);
}

function suggestAcceptanceCriteria(issue) {
  // Your existing AC suggestion logic
  console.log('Suggesting AC for:', issue.key);
} 