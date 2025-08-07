import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button} from "@mui/material";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import {scrollIntoView} from '../../../../utils/scrollIntoView'
import DeleteAccount from './deleteAccount'

const Legals = ({isactive}) => {
  const navigate = useNavigate();
  const {setPriorityDisplay} = usePriorityDisplay();
  const policies = [
    { key: "terms", title: "Terms of Service", buttonLabel: "View Terms and Conditions" },
    { key: "privacy", title: "Privacy Policy", buttonLabel: "View Privacy Policy" },
    { key: "cookie", title: "Cookie Policy", buttonLabel: "View Cookie Policy" },
  ];
  function handlePolicyClick(link){
    navigate('/policies',{state: {extra: link}}); 
    setPriorityDisplay('policies');
    scrollIntoView('header'); 
  }
  return (
    <section 
      id="legal"
      style={{display: isactive === 'legal' || isactive === null ? 'block' : 'none',}}
    >
        <h2>Legal & Compliance</h2>
        <div className="space-y-6 ">
          {policies.map((policy) => (
            <div key={policy.key}>
              <h3 className='mb-2'>{policy.title}</h3>
              <Button
                sx={{
                  color: 'var(--merime-theme)',
                  borderColor:'var(--merime-theme)'
                }} 
                variant="outlined"
                onClick={() => handlePolicyClick(policy.key)}
              >{policy.buttonLabel}</Button>
            </div>
          ))}
          <h2>Account Deletion</h2>
          <DeleteAccount/>
        </div> 
    </section>
  );
};

export default Legals;
