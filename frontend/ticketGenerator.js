/* frontend/ticketGenerator.js */

async function generatePremiumTicket(b, btnElement) {
    const originalDisplay = btnElement.parentNode.style ? btnElement.parentNode.style.display : '';
    if (btnElement.parentNode && btnElement.parentNode.style) {
        btnElement.parentNode.style.display = 'none';
    }

    const paxArray = Array.isArray(b.passengers) ? b.passengers : [];
    const paxCount = paxArray.length || 1;
    
    // Resolve fare safely
    let totalFare = b.fareTotal || b.totalAmount || b.totalFare || b.amount || 0;
    if (totalFare === 0 && paxCount > 0 && b.trainNo) totalFare = paxCount * 120; // safe arbitrary fallback if API missed
    
    let perPassengerFare = 0;
    if (Array.isArray(b.farePerPax) && b.farePerPax.length > 0) {
        perPassengerFare = b.farePerPax[0];
    } else {
        perPassengerFare = Math.round(totalFare / paxCount);
    }
    
    // Build passengers table
    const paxRows = paxArray.map(p => {
        const berth = p.berthAllocated || p.berthPreference || 'Auto';
        const seatLabel = (p.coach && p.seatNumber) ? `${p.coach}-${p.seatNumber}` : (p.seatLabel ? p.seatLabel : '');
        return `
            <tr>
              <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#1e293b;">${p.name || '-'}</td>
              <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569;">${p.age || '-'}</td>
              <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; text-transform:capitalize;">${p.gender || '-'}</td>
              <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569;">${berth} ${seatLabel ? `(${seatLabel})` : ''}</td>
            </tr>
        `;
    }).join('');

    const template = `
        <div id="pdf-ticket-render" style="width: 297mm; height: 210mm; overflow: hidden; background: #ffffff; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif, Arial; position: relative;">
            <div style="background: #ffffff; border-radius: 16px; margin: 10mm 15mm; border:1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); height: 190mm;">
                
                <!-- Header -->
                <div style="background: #0052cc; color: white; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <span style="font-size: 38px;">🚆</span>
                        <div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">BookMyTrack</h1>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9; font-weight: 400;">Travel Made Inclusive</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px;">E-TICKET</h2>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Happy Journey!</p>
                    </div>
                </div>

                <!-- Main Info -->
                <div style="padding: 25px 40px; display: flex; gap: 40px; flex: 1;">
                    <!-- Left PNR Block (No QR per user request) -->
                    <div style="min-width: 180px; text-align: center; border-right: 1.5px dashed #cbd5e1; padding-right: 40px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                        <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase;">PNR NO.</p>
                        <h2 style="margin: 5px 0 0 0; font-size: 36px; color: #0052cc; font-weight: 800; letter-spacing: 2px;">${b.pnr}</h2>
                    </div>

                    <!-- Right Journey Data -->
                    <div style="flex: 1; display:flex; flex-direction:column; justify-content:center;">
                        <p style="margin: 0 0 15px 0; font-weight: 600; font-size: 18px; color: #1e293b; display:flex; align-items:center; gap:8px;">
                           <span style="font-size: 20px;">🚄</span> ${b.trainNo || ''} ${b.trainName ? '- ' + b.trainName : ''}
                        </p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <div>
                                <h3 style="margin: 0; font-size: 26px; color: #0f172a; text-transform: uppercase; font-weight:800;">${b.from.split(' ')[0]}</h3>
                                <p style="margin: 5px 0 0 0; color: #64748b; font-size:14px;">${b.from}</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px; color: #94a3b8; flex:1; justify-content: center; padding:0 20px;">
                                <div style="height: 1.5px; background: #cbd5e1; flex: 1; max-width: 100px;"></div>
                                <span style="font-size: 20px;">🚆</span>
                                <div style="height: 1.5px; background: #cbd5e1; flex: 1; max-width: 100px;"></div>
                            </div>
                            <div style="text-align: right;">
                                <h3 style="margin: 0; font-size: 26px; color: #0f172a; text-transform: uppercase; font-weight:800;">${b.to.split(' ')[0]}</h3>
                                <p style="margin: 5px 0 0 0; color: #64748b; font-size:14px;">${b.to}</p>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #f1f5f9;">
                            <div>
                                <p style="margin: 0; font-size: 13px; color: #64748b; display:flex; align-items:center; gap:6px;">📅 Journey Date</p>
                                <p style="margin: 8px 0 0 0; font-weight: 600; color: #1e293b; font-size:16px;">${new Date(b.journeyDate).toDateString()}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 13px; color: #64748b; display:flex; align-items:center; gap:6px;">🎫 Status</p>
                                <p style="margin: 8px 0 0 0; font-weight: 700; color: ${String(b.status).toLowerCase() === 'cancelled' ? '#dc2626' : '#16a34a'}; text-transform: uppercase; font-size:16px;">${b.status}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 13px; color: #64748b; display:flex; align-items:center; gap:6px;">#️⃣ Train No.</p>
                                <p style="margin: 8px 0 0 0; font-weight: 600; color: #1e293b; font-size:16px;">${b.trainNo}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fare & Pax Block -->
                <div style="padding: 0 40px 25px 40px;">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; background: #f0f7ff; padding: 15px 25px; border-radius: 12px; display: flex; align-items: center; gap: 20px; border:1px solid #e0f2fe;">
                            <div style="background: #dbeafe; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0052cc; font-size: 22px;">₹</div>
                            <div>
                                <p style="margin: 0; font-size: 14px; color: #64748b;">Total Fare</p>
                                <h3 style="margin: 5px 0 0 0; font-size: 20px; color: #0f172a;">₹${totalFare} (INR)</h3>
                            </div>
                        </div>
                        <div style="flex: 1; background: #f0f7ff; padding: 15px 25px; border-radius: 12px; display: flex; align-items: center; gap: 20px; border:1px solid #e0f2fe;">
                            <div style="background: #dbeafe; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0052cc; font-size: 20px;">👤</div>
                            <div>
                                <p style="margin: 0; font-size: 14px; color: #64748b;">Per Passenger</p>
                                <h3 style="margin: 5px 0 0 0; font-size: 20px; color: #0f172a;">₹${perPassengerFare}</h3>
                            </div>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 15px; margin-bottom: 20px;">
                        <thead>
                            <tr>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-weight:600;">Passenger(s)</th>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-weight:600;">Age</th>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-weight:600;">Gender</th>
                                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-weight:600;">Berth / Seat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paxRows}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; align-items: center; gap: 15px; background: #eff6ff; padding: 12px 20px; border-radius: 8px; border-left: 5px solid #0052cc;">
                        <span style="font-size: 24px; color: #0052cc;">ℹ️</span>
                        <div style="font-size:13px; color:#334155;">
                            <strong style="color: #0f172a; font-size:14px;">Thank you for choosing BookMyTrack!</strong><br>
                            Please carry a valid ID proof along with this digital E-Ticket during your journey.
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #0052cc; color: rgba(255,255,255,0.9); padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                       <span style="font-size: 20px;">📞</span>
                       <div>Need Help?<br><strong style="color:white;">Contact Support</strong></div>
                    </div>
                    <div>Travel Safe &nbsp;|&nbsp; Travel Smart &nbsp;|&nbsp; Travel Inclusive</div>
                    <div style="font-weight:600; color:white;">www.bookmytrack.in</div>
                </div>
            </div>
        </div>
    `;

    // Inject into body temporarily
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '100vw'; // Positive off-screen coordinates prevent html2canvas bounds clipping
    tempDiv.style.zIndex = '-1000';
    tempDiv.style.width = '297mm'; // Lock formatting dimensions exactly
    tempDiv.innerHTML = template;
    document.body.appendChild(tempDiv);

    const targetElement = tempDiv.firstElementChild;

    try {
        await html2pdf().set({
            margin: 0,
            filename: `Ticket_${b.pnr}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(targetElement).save();
    } catch(err) {
        console.error('PDF Generation Error:', err);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
        }
        if (btnElement.parentNode && btnElement.parentNode.style) {
            btnElement.parentNode.style.display = originalDisplay;
        }
    }
}
