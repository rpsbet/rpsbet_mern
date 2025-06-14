import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from '@mui/material';
import { convertToCurrency } from '../util/conversion';
import { getRank } from '../util/getRank';

const RankAllowancesTable = ({ categories }) => {
	const accountCreationDate = useSelector((state) => state.auth.user.created_at);
	const rank = getRank(useSelector((state) => state.auth.totalWagered));
	const solPrice = useSelector((state) => state.logic.solPrice);


	// Function to calculate account age in days
	const getAccountAgeInDays = (creationDate) => {
		const accountCreatedAt = new Date(creationDate);
		const currentDate = new Date();
		return Math.floor((currentDate - accountCreatedAt) / (24 * 60 * 60 * 1000));
	};

	const accountAgeInDays = useMemo(() => getAccountAgeInDays(accountCreationDate), [accountCreationDate]);

	// Function to get the highlighted row index
	const highlightedRowIndex = useMemo(() => {
		let bestCategoryIndex = 0; // Default to the first row
		for (let i = 0; i < categories.length; i++) {
			if (rank >= categories[i].rankThreshold && accountAgeInDays >= categories[i].accountAgeThresholdInDays) {
				bestCategoryIndex = i;
			} else {
				break; // Stop at the first invalid rank
			}
		}
		return bestCategoryIndex;
	}, [rank, accountAgeInDays, categories]);


	const visibleCategories = useMemo(() => categories.slice(highlightedRowIndex), [highlightedRowIndex, categories]);

	return (
		<Box sx={{ mb: 3 }}>
			<TableContainer sx={{ maxHeight: 150, overflow: 'auto', borderRadius: 2 }}>
				<Table stickyHeader size="small" sx={{ 'td, th': { fontSize: '0.85rem', padding: '4px 8px' } }}>
					<TableHead sx={{ backgroundColor: '#222' }}>
						<TableRow>
							<TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>
								RANK
							</TableCell>
							<TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>
								MAX DEBT ALLOWANCE (SOL)
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{visibleCategories.map((category) => {
							const isHighlighted = category.rankThreshold === categories[highlightedRowIndex].rankThreshold;

							return (
								<TableRow
									key={category.rankThreshold}
									sx={{
										backgroundColor: isHighlighted ? '#28a745' : '#333',
									}}
								>
									<TableCell sx={{ color: '#fff' }} align="center">
										<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
										
											<span>{category.rankThreshold}</span>
										</Box>
									</TableCell>
									<TableCell sx={{ color: '#fff' }} align="center">
										{category.maxAllowance} ({convertToCurrency(category.maxAllowance, solPrice)})
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			<Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center', opacity: 0.8 }}>
				You must have a credit score above 700 to be eligible.
			</Typography>
		</Box>
	);
};

export default RankAllowancesTable;