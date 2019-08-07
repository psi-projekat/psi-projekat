<?php
  class AddCompetition extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, isMod
        from User where token = ?
      ');
      $st->execute([$args->token]);
      $row = $st->fetch();

      if($row === false){
        $this->err('data');
        return;
      }

      if($row['isMod'] !== 1){
        $this->err('forbidden');
        return;
      }

      $pdo->prepare('
        insert into Competition (
          createdBy,
          title,
          description,
          startDate,
          endDate,
          idGoal,
          maxUsers,
          currentUsers,
          points
        ) values (
          ?, ?, ?, ?,
          0, 0, ?, 0, 0
        )
      ')->execute([
        $row['id'],
        $args->title,
        $args->desc,
        $args->startDate,
        $args->maxUsers,
      ]);

      $this->succ();
    }
  }

  new AddCompetition();
?>