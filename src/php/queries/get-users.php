<?php
  class GetUsers extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select nick
        from User
        where instr(nick, ?) > 0
        order by registrationDate desc
      ');
      $st->execute([$args->keywords]);
      $this->succ($st->fetchAll());
    }
  }

  new GetUsers();
?>