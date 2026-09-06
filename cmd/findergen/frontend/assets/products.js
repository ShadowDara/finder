function i(n,a){n.innerHTML=a.map(e=>`
        <article>
          <h2>${e.name}</h2>
          <strong>${e.price} €</strong>
        </article>
      `).join("")}export{i as default};
