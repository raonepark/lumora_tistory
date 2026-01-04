// Accordion Category Logic for Lumora Skin
(function () {
  // 1. Mock Data Injection (Only if specific category has no children)
  function injectMockData() {
    // Find "개발 & 컴퓨터 활용" link
    var links = document.querySelectorAll(".tt_category li > a");
    var targetLink = null;
    
    // Normalize text and find target
    for(var i=0; i<links.length; i++) {
        var text = links[i].firstChild.textContent.trim();
        if(text === '개발 & 컴퓨터 활용') {
            targetLink = links[i];
            break;
        }
    }

    if (targetLink) {
      var parentLi = targetLink.parentElement;
      // Check if it already has a sub_category_list
      if (!parentLi.querySelector(".sub_category_list")) {
        // Create mock sub-list
        var ul = document.createElement("ul");
        ul.className = "sub_category_list";
        
        var items = ["Appium", "Selenium", "Python"];
        items.forEach(function(item) {
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = "#"; // Mock link
            a.className = "link_sub_item";
            a.textContent = item;
            li.appendChild(a);
            ul.appendChild(li);
        });
        
        parentLi.appendChild(ul);
        // Add Tistory's specific icon class if needed, or just rely on CSS
      }
    }
  }

  // 2. Setup Accordion Structure
  function setupAccordion() {
    var categoryItems = document.querySelectorAll(".tt_category li");
    
    categoryItems.forEach(function (li) {
      var subList = li.querySelector("ul.sub_category_list, ul.sub-category-list"); // Custom or default class
      
      if (subList) {
        li.classList.add("has-sub");
        
        // 2.1 "View All" Link Injection
        // Check if "View All" already exists to avoid duplication
        if (!subList.querySelector(".view-all-item")) {
            var parentLink = li.querySelector("a");
            if(parentLink) {
                var viewAllLi = document.createElement("li");
                viewAllLi.className = "view-all-item";
                
                var viewAllLink = document.createElement("a");
                viewAllLink.href = parentLink.href; // Point to parent's original link
                viewAllLink.textContent = "📂 전체 보기";
                viewAllLink.className = "link_sub_item view-all-link";
                
                viewAllLi.appendChild(viewAllLink);
                // Insert as first child
                subList.insertBefore(viewAllLi, subList.firstChild);
            }
        }

        // 2.2 Click Interaction
        var parentLink = li.querySelector("a");
        // Clone and replace to remove listeners or add refreshing listener
        // But better to just add event listener that stops prop if it's the main link
        
        // We need to capture the click on the PARENT LINK only
        // Tistory structure: <li> <a class="link_item">Text <span class="c_cnt">(N)</span></a> <ul class="sub">...</ul> </li>
        
        // Remove old listener if any (simplest way is to clone if we want to be destructive, but let's just add)
        // Since we want to PREVENT page navigation, we absolutely must preventDefault.
        
        parentLink.addEventListener("click", function(e) {
            // Only toggle if it has sub-menu
            e.preventDefault();
            
            // Toggle expanded class
            var isExpanded = li.classList.contains("expanded");
            
            // Optional: Close others? The user didn't explicitly ask for "accordion (one open at a time)", just "accordion dropdown".
            // Usually accordion implies one at a time, but typical file trees allow multiple. 
            // Let's stick to allowing multiple open unless "accordion" strictly means toggling.
            // Let's toggle THIS one.
            
            if (isExpanded) {
                li.classList.remove("expanded");
            } else {
                li.classList.add("expanded");
            }
        });
      }
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    // Run after a slight delay to ensure Tistory might have rendered if it was dynamic (though usually static HTML)
    // But for playground, we run immediately or after body.
    
    // For specific task requirement 1: Inject data if missing
    injectMockData();
    
    // Setup
    setupAccordion();
  });

})();
