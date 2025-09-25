import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
} from '@mui/material';

const PromotionRulesTab = ({
  rules,
  loading,
  onAddRule,
  onEditRule,
  onDeleteRule,
}) => {
  const getBeneficiaryLabel = (beneficiary) => {
    switch (beneficiary) {
      case 0: return 'REFERRED';
      case 1: return 'REFERRER';
      case 2: return 'BOTH';
      default: return beneficiary;
    }
  };

  const formatLabel = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div />
        <Button variant="contained" color="primary" onClick={onAddRule}>
          Add Rule
        </Button>
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Max Usage</TableCell>
              <TableCell>Beneficiary</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No promotion rules found
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{formatLabel(rule.promotion_rule_action?.name)}</TableCell>
                  <TableCell>{formatLabel(rule.promotion_rule_event?.name)}</TableCell>
                  <TableCell>{rule.max_usage}</TableCell>
                  <TableCell>{getBeneficiaryLabel(rule.beneficiary)}</TableCell>
                  <TableCell>{new Date(rule.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button onClick={() => onEditRule(rule)}>Edit</Button>
                    <Button onClick={() => onDeleteRule(rule.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PromotionRulesTab;