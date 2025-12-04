import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, Tab, Box, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import PromotionCodesTab from './PromotionCodesTab';
import PromotionUsagesTab from './PromotionUsagesTab';
import PromotionRulesTab from './PromotionRulesTab';
import AddPromotionDialog from './AddPromotionDialog';
import AddEditRuleDialog from './AddEditRuleDialog';
import BulkGeneratePromoModal from '../../Components/Modals/BulkGeneratePromoModal';
import {
  getPromotions,
  getPromotionUsages,
  addPromotion,
  getPromotionRuleActions,
  getPromotionRuleEvents,
  getPromotionRules,
  addPromotionRule,
  updatePromotionRule,
  deletePromotionRule,
  expirePromotion,
  exportPromoCodesCsv,
} from '../../core/apis/promotionsAPI';

const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false);
  const [formData, setFormData] = useState({
    rule_id: '',
    code: '',
    bundle_code: '',
    type: 'PROMOTION',
    name: '',
    amount: '',
    callback_url: '',
    callback_headers: '',
    valid_from: null,
    valid_to: null,
    is_active: true,
  });
  const [ruleActions, setRuleActions] = useState([]);
  const [ruleEvents, setRuleEvents] = useState([]);
  const [promotionRules, setPromotionRules] = useState([]);
  const [filters, setFilters] = useState([]);
  const [rules, setRules] = useState([]);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    promotion_rule_action_id: '',
    promotion_rule_event_id: '',
    max_usage: 1,
    beneficiary: 0,
    rule_description: '',
  });

  useEffect(() => {
    fetchRuleActions();
    fetchRuleEvents();
    fetchPromotionRules();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchPromotions();
    } else if (activeTab === 1) {
      fetchUsages();
    } else if (activeTab === 2) {
      fetchRules();
    }
  }, [activeTab, page, pageSize, filters]);

  const fetchPromotions = async () => {
    setLoading(true);
    // Convert date filters to UTC strings without timezone
    const processedFilters = { ...filters };
    if (processedFilters.valid_from) {
      processedFilters.valid_from = new Date(processedFilters.valid_from).toISOString().split('T')[0];
    }
    if (processedFilters.valid_to) {
      processedFilters.valid_to = new Date(processedFilters.valid_to).toISOString().split('T')[0];
    }
    if (processedFilters.created_from) {
      processedFilters.created_from = new Date(processedFilters.created_from).toISOString();
    }
    if (processedFilters.created_to) {
      processedFilters.created_to = new Date(processedFilters.created_to).toISOString();
    }
    
    const { data, error, count, adjustedPage } = await getPromotions(processedFilters, page, pageSize);
    if (error) {
      toast.error('Failed to fetch promotions');
    } else {
      setPromotions(data || []);
      setTotalRows(count || 0);
      // Update page if it was adjusted due to pagination overflow
      if (adjustedPage !== undefined && adjustedPage !== page) {
        setPage(adjustedPage);
      }
    }
    setLoading(false);
  };

  const fetchUsages = async () => {
    setLoading(true);
    // Convert date filters to UTC strings without timezone
    const processedFilters = { ...filters };
    if (processedFilters.created_from) {
      processedFilters.created_from = new Date(processedFilters.created_from).toISOString().split('T')[0];
    }
    if (processedFilters.created_to) {
      processedFilters.created_to = new Date(processedFilters.created_to).toISOString().split('T')[0];
    }
    
    const { data, error, count, adjustedPage } = await getPromotionUsages(processedFilters, page, pageSize);
    if (error) {
      toast.error('Failed to fetch promotion usages');
    } else {
      setUsages(data || []);
      setTotalRows(count || 0);
      // Update page if it was adjusted due to pagination overflow
      if (adjustedPage !== undefined && adjustedPage !== page) {
        setPage(adjustedPage);
      }
    }
    setLoading(false);
  };

  const fetchRuleActions = async () => {
    const { data, error } = await getPromotionRuleActions();
    if (!error) {
      setRuleActions(data || []);
    }
  };

  const fetchRuleEvents = async () => {
    const { data, error } = await getPromotionRuleEvents();
    if (!error) {
      setRuleEvents(data || []);
    }
  };

  const fetchPromotionRules = async () => {
    const { data, error } = await getPromotionRules();
    if (!error) {
      setPromotionRules(data || []);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await getPromotionRules();
    if (error) {
      toast.error('Failed to fetch promotion rules');
    } else {
      setRules(data || []);
    }
    setLoading(false);
  };

  const handleAddPromotion = async () => {
    // Validation
    if (!formData.rule_id) {
      toast.error('Please select a rule');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Please enter a promotion code');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const { data, error } = await addPromotion(formData);
    if (error) {
      toast.error('Failed to add promotion');
    } else {
      toast.success('Promotion added successfully');
      setAddDialogOpen(false);
      setFormData({
        rule_id: '',
        code: '',
        bundle_code: '',
        type: 'PROMOTION',
        name: '',
        amount: '',
        callback_url: '',
        callback_headers: '',
        valid_from: null,
        valid_to: null,
        is_active: true,
      });
      fetchPromotions();
    }
  };

  const handleAddRule = async () => {
    const { data, error } = await addPromotionRule(ruleFormData);
    if (error) {
      toast.error('Failed to add promotion rule');
    } else {
      toast.success('Promotion rule added successfully');
      setRuleDialogOpen(false);
      setRuleFormData({
        promotion_rule_action_id: '',
        promotion_rule_event_id: '',
        max_usage: 1,
        beneficiary: 0,
        rule_description: '',
      });
      fetchRules();
      fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
    }
  };

  const handleEditRule = async () => {
    const { data, error } = await updatePromotionRule(editingRule.id, ruleFormData);
    if (error) {
      toast.error('Failed to update promotion rule');
    } else {
      toast.success('Promotion rule updated successfully');
      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleFormData({
        promotion_rule_action_id: '',
        promotion_rule_event_id: '',
        max_usage: 1,
        beneficiary: 0,
        rule_description: '',
      });
      fetchRules();
      fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion rule?')) {
      const { error } = await deletePromotionRule(id);
      if (error) {
        toast.error('Failed to delete promotion rule');
      } else {
        toast.success('Promotion rule deleted successfully');
        fetchRules();
        fetchPromotionRules(); // Reload promotion rules for the add promotion dialog
      }
    }
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setRuleFormData({
      promotion_rule_action_id: rule.promotion_rule_action_id,
      promotion_rule_event_id: rule.promotion_rule_event_id,
      max_usage: rule.max_usage,
      beneficiary: rule.beneficiary,
      rule_description: rule.rule_description || '',
    });
    setRuleDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingRule(null);
    setRuleFormData({
      promotion_rule_action_id: '',
      promotion_rule_event_id: '',
      max_usage: 1,
      beneficiary: 0,
      rule_description: '',
    });
    setRuleDialogOpen(true);
  };

  const openAddPromotionDialog = async () => {
    await fetchPromotionRules();
    setAddDialogOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setFilters({});
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpirePromotion = async (code) => {
    if (window.confirm(`Are you sure you want to expire promotion code "${code}"?`)) {
      const { error } = await expirePromotion(code);
      if (error) {
        toast.error('Failed to expire promotion');
      } else {
        toast.success('Promotion expired successfully');
        fetchPromotions();
      }
    }
  };

  const handleBulkGenerate = () => {
    setBulkGenerateOpen(true);
  };

  const handleBulkGenerateSuccess = () => {
    toast.success('Promo codes generated successfully!');
    fetchPromotions();
  };

  const handleExportCsv = async () => {
    try {
      // Process date filters same as fetchPromotions
      const processedFilters = { ...filters };
      if (processedFilters.valid_from) {
        processedFilters.valid_from = new Date(processedFilters.valid_from).toISOString();
      }
      if (processedFilters.valid_to) {
        processedFilters.valid_to = new Date(processedFilters.valid_to).toISOString();
      }
      if (processedFilters.created_from) {
        processedFilters.created_from = new Date(processedFilters.created_from).toISOString();
      }
      if (processedFilters.created_to) {
        processedFilters.created_to = new Date(processedFilters.created_to).toISOString();
      }
      
      await exportPromoCodesCsv(processedFilters);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error(`Failed to export CSV: ${error.message}`);
    }
  };

  return (
    <Card className="page-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography variant="h4">Promotions</Typography>
        <div />
      </div>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="promotion tabs">
        <Tab label="Promotion Codes" />
        <Tab label="Promotion Usages" />
        <Tab label="Promotion Rules" />
      </Tabs>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && (
          <PromotionCodesTab
            promotions={promotions}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalRows={totalRows}
            filters={filters}
            setFilters={setFilters}
            setPage={setPage}
            setPageSize={setPageSize}
            handlePageChange={handlePageChange}
            handlePageSizeChange={handlePageSizeChange}
            onAddPromotion={() => setAddDialogOpen(true)}
            onExpirePromotion={handleExpirePromotion}
            onBulkGenerate={handleBulkGenerate}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 1 && (
          <PromotionUsagesTab
            usages={usages}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalRows={totalRows}
            filters={filters}
            setFilters={setFilters}
            setPage={setPage}
            setPageSize={setPageSize}
            handlePageChange={handlePageChange}
            handlePageSizeChange={handlePageSizeChange}
          />
        )}

        {activeTab === 2 && (
          <PromotionRulesTab
            rules={rules}
            loading={loading}
            onAddRule={openAddDialog}
            onEditRule={openEditDialog}
            onDeleteRule={handleDeleteRule}
          />
        )}
      </Box>

      <AddPromotionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        promotionRules={promotionRules}
        onSubmit={handleAddPromotion}
      />

      <AddEditRuleDialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        formData={ruleFormData}
        setFormData={setRuleFormData}
        ruleActions={ruleActions}
        ruleEvents={ruleEvents}
        editingRule={editingRule}
        onSubmit={editingRule ? handleEditRule : handleAddRule}
      />

      <BulkGeneratePromoModal
        open={bulkGenerateOpen}
        onClose={() => setBulkGenerateOpen(false)}
        onSuccess={handleBulkGenerateSuccess}
      />
    </Card>
  );
};

export default PromotionsPage;